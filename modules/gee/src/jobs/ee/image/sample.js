const {job} = require('#gee/jobs/job')
const ee = require('sepal/src/ee')

const worker$ = ctx => {
    const {recipeToSample, count, scale, classBand, recipe, bands} = ctx
    const ImageFactory = require('#sepal/ee/imageFactory')
    const {expand, forkJoin, last, map, switchMap, takeWhile} = require('rxjs')
    const {getRows$} = require('#sepal/ee/table')
    const log = require('#sepal/log').getLogger('ee')

    return forkJoin({
        image: ImageFactory(recipeToSample).getImage$(),
        geometry: ImageFactory(recipe).getGeometry$()
    }).pipe(
        switchMap(({image, geometry}) => {

            const stratifiedSample = () => {
                const toSample = classBand
                    ? image
                    : image.addBands(ee.Image(0).rename('stratum'))
                const samples = toSample
                    .stratifiedSample({
                        numPoints: parseInt(count),
                        classBand: classBand || 'stratum',
                        scale: parseInt(scale),
                        region: geometry,
                        geometries: true,
                        tileScale: 16
                    })
                return getRows$(
                    bands ? samples.select(bands) : samples.select(image.bandNames()),
                    'sample image'
                )
            }

            const unstratifiedSample = () => {
                const numPixels = parseInt(count)
                const chunkSize = 5000
                const initialNumPixels = Math.min(numPixels, chunkSize)

                return sample$(initialNumPixels, 0).pipe(
                    map(rows => ({...rows, numPixels: initialNumPixels})),
                    expand(accRows => {
                        const fraction = Math.max(accRows.features.length, 1) / accRows.numPixels
                        const numPixelsLeft = numPixels - accRows.features.length
                        const chunkNumPixels = Math.ceil(Math.min(
                            numPixelsLeft / fraction,
                            chunkSize
                        ))
                        log.info(`Found ${accRows.features.length}/${numPixels} samples. Fraction of pixels containing data: ${fraction}`)
                        return sample$(chunkNumPixels, accRows.features.length).pipe(
                            map(newRows => ({
                                columns: newRows.columns,
                                features: [...accRows.features, ...newRows.features].slice(0, numPixels),
                                numPixels: accRows.numPixels + chunkNumPixels
                            }))
                        )
                    }),
                    takeWhile(rows => rows.features.length < numPixels, true),
                    last(),
                    map(rows => {
                        return rows
                    })
                )

                function sample$(n, i) {
                    return ee.getInfo$(sample(n, i), 'sample image chunk ' + i)
                }

                function sample(numPixels, seed) {
                    const toSample = bands
                        ? image.select(bands)
                        : image
                    log.info('sampling', numPixels)
                    return toSample.sample({
                        region: geometry,
                        scale: parseInt(scale),
                        projection: 'EPSG:4326',
                        numPixels: numPixels,
                        seed: seed,
                        tileScale: 16,
                        geometries: true
                    })
                }

            }

            return classBand
                ? stratifiedSample()
                : unstratifiedSample()
        })
    )
}

module.exports = job({
    jobName: 'Sample image',
    jobPath: __filename,
    args: ctx => [ctx.request.body],
    worker$
})
