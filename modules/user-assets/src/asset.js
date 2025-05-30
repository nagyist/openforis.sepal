const _ = require('lodash')
const log = require('#sepal/log').getLogger('asset')
const {get$, delete$, postJson$} = require('#sepal/httpClient')

const {map} = require('rxjs')
const {userTag} = require('./tag')

const GEE_ENDPOINT = 'http://gee'
const LIST_ASSETS_URL = `${GEE_ENDPOINT}/asset/descendants`
const DELETE_ASSET_URL = `${GEE_ENDPOINT}/asset/delete`
const CREATE_FOLDER_URL = `${GEE_ENDPOINT}/asset/createFolder`

const getAsset$ = (user, id = '') => {
    log.trace(`${userTag(user.username)} loading:`, id || 'roots')
    return get$(LIST_ASSETS_URL, {
        query: {id},
        headers: {
            'sepal-user': getSepalUserHeader(user)
        },
        retry: {
            maxRetries: 0
        }
    }).pipe(
        map(({body}) => JSON.parse(body))
    )
}

const deleteAsset$ = (user, id) =>
    delete$(DELETE_ASSET_URL, {
        query: {id},
        headers: {
            'sepal-user': getSepalUserHeader(user)
        },
        retry: {
            maxRetries: 0
        }
    }).pipe(
        // map(({body}) => JSON.parse(body))
    )

const createFolder$ = (user, id) =>
    postJson$(CREATE_FOLDER_URL, {
        body: {id},
        headers: {
            'sepal-user': getSepalUserHeader(user)
        },
        retry: {
            maxRetries: 0
        }
    })

const getSepalUserHeader = user =>
    serialize(_.pick(user, ['id', 'username', 'googleTokens', 'status', 'roles', 'systemUser', 'admin']))
            
const serialize = value => {
    try {
        return _.isNil(value)
            ? null
            : JSON.stringify(value)
    } catch (error) {
        log.warn('Cannot serialize value:', value)
    }
}
    
module.exports = {getAsset$, deleteAsset$, createFolder$}
