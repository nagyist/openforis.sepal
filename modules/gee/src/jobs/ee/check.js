const {job} = require('#gee/jobs/job')

const REQUIRED_SCOPES = [
    'https://www.googleapis.com/auth/cloudplatformprojects.readonly',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/earthengine'
]

const worker$ = (_ignore, {sepalUser: {googleTokens: {accessToken}}}) => {
    const ee = require('#sepal/ee')
    const {catchError, from, map, switchMap, throwError} = require('rxjs')
    const {ClientException} = require('sepal/src/exception')
    const {ERROR_CODES: {EE_NOT_AVAILABLE, MISSING_OAUTH_SCOPES}} = require('sepal/src/exception')

    const {google} = require('googleapis')

    const oAuth2Client = new google.auth.OAuth2()
    oAuth2Client.setCredentials({
        access_token: accessToken
    })
    const testEEInteraction = () =>
        ee.getInfo$(ee.Image(), 'can communicate with EE servers').pipe(
            catchError(cause => {throw new ClientException('Failed to communicate with EE', {cause, errorCode: EE_NOT_AVAILABLE})})
        )

    return from(oAuth2Client.getTokenInfo(accessToken)).pipe(
        switchMap(({scopes}) => {
            const hasAllScopes = scopes.every(scope => REQUIRED_SCOPES.includes(scope))
            return hasAllScopes
                ? testEEInteraction()
                : throwError(() => new ClientException('Doesn\'t have all scopes', {errorCode: MISSING_OAUTH_SCOPES}))
        }),
        map(() => ({'status': 'OK'}))
    )

}

module.exports = job({
    jobName: 'EE check',
    jobPath: __filename,
    worker$
})
