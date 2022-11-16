import {exec} from './exec.js'
import {exit, getModules, isModule, isRunnable, showModuleStatus, MESSAGE, getStatus, showStatus} from './utils.js'
import {logs} from './logs.js'
import {getDirectRunDeps} from './deps.js'
import {SEPAL_SRC, ENV_FILE} from './config.js'
import _ from 'lodash'

const startModule = async (module, options = {}, rootModule) => {
    try {
        if (isModule(module)) {
            if (isRunnable(module)) {
                showModuleStatus(module, MESSAGE.STARTING, {sameLine: true})
                await exec({
                    command: './script/docker-compose-up.sh',
                    args: [module, SEPAL_SRC, ENV_FILE],
                    showStdOut: options.verbose
                })
                if (rootModule && options.logTail) {
                    await showStatus([module])
                    await logs(module, {follow: true, tail: true})
                } else {
                    await waitModuleRunning(module)
                }
            } else {
                showModuleStatus(module, MESSAGE.NON_RUNNABLE)
            }
        }
    } catch (error) {
        showModuleStatus(module, MESSAGE.ERROR)
        exit({error})
    }
}

const waitModuleRunning = async module =>
    new Promise((resolve, reject) => {
        const wait = async (count = 0) => {
            const [{status, services}] = await getStatus([module], true)
            if (status) {
                if (services) {
                    if (_.some(services, ({state, health}) => state === 'RUNNING' && health === 'UNHEALTHY')) {
                        showModuleStatus(module, status, {sameLine: false})
                        return reject(`Cannot start module ${module}`)
                    }
                    if (_.every(services, ({state, health}) => state === 'RUNNING' && (health === '' || health === 'HEALTHY'))) {
                        showModuleStatus(module, status, {sameLine: false})
                        return resolve()
                    }
                    showModuleStatus(module, [status, '.'.repeat(count)].join(' '), {sameLine: true})
                    setTimeout(() => wait(count + 1), 1000)
                }
            } else {
                showModuleStatus(module, MESSAGE.STOPPED)
                return resolve()
            }
        }
        wait()
    })

const getModulesToStart = (modules, options = {}) => {
    const dependencies = _.flatten(
        modules.map(module =>
            getModulesToStart(getDirectRunDeps(module), options)
        )
    )

    return [
        ...dependencies,
        ...modules
    ]
}

export const start = async (modules, options) => {
    const rootModules = getModules(modules)
    const startModules = _.uniq(getModulesToStart(rootModules, options))
    for (const module of startModules) {
        await startModule(module, options, rootModules.includes(module))
    }
}
