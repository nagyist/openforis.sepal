package component.files

import org.openforis.sepal.component.files.api.UserFile
import org.openforis.sepal.util.DateTime

class QueryFiles_Test extends AbstractFilesTest {
    def 'Given empty home directory, when querying root, no files are returned'() {
        when:
        def result = query('/')
        
        then:
        result == [dir: true, count: 0, files: [:]]
    }

    def 'Given a file at the root, when querying root, file is returned'() {
        def file = addFile('file.txt')
        when:
        def result = query('/')

        then:
        result == [
            dir: true, 
            count: 1, 
            files: [
                'file.txt': [
                    size: file.size, 
                    lastModified: lastModified(file)
                ]
            ]
        ]
    }

    def 'Given an empty dir at the root, when querying root, dir is returned'() {
        addDir('dir')

        when: 
        def result = query('/')

        then:
        result == [
            dir: true, 
            count: 1, 
            files: [
                'dir': [
                    dir: true, 
                    count: 0
                ]
            ]
        ]
    }

    def 'Given a non-modified file at the root, when querying root with last-modified for file, file is not returned'() {
        def file = addFile('file.txt')

        when:
        def result = query('/', [
            dir: true, 
            count: 1, 
            files: [
                'file.txt': [
                    lastModified: lastModified(file)
                ]
            ]
        ])

        then:
        result ==  [dir: true, count: 1, files: [:]]
    }

    def 'Given a modified file, when querying root with last-modified for file, file is returned'() {
        def file = addFile('file.txt')

        when: 
        def result = query('/', [
            dir: true, 
            count: 1, 
            files: [
                'file.txt': [
                    lastModified: longTimeAgo
                ]
            ]
        ])

        then:
        result == [
            dir: true,
            count: 1,
            files: [
                'file.txt': [
                    size: file.size, 
                    lastModified: lastModified(file)
                ]
            ]
        ]
    }

    def 'Given no files, when querying root with last-modified for a non-existing file, file is returned with removed: true'() {
        when: 
        def result = query('/', [
            dir: true,
            count: 1,
            files: [
                'file.txt': [
                    lastModified: longTimeAgo
                ]
            ]
        ])

        then:
        result == [
            dir: true,
            count: 0,
            files: [
                'file.txt': [
                    removed: true
                ]
            ]
        ]
    }

    def 'Given a nested directory, when querying root with last-modified for a non-existing file, nested dir and file with removed: true is returned'() {
        addDir('nestedDir')

        when:
        def result = query('/', [
            dir: true,
            count: 1,
            files: [
                'file.txt': [
                    lastModified: longTimeAgo
                ]
            ]
        ])

        then:
        result == [
            dir: true,
            count: 1,
            files: [
                'nestedDir': [
                    dir: true,
                    count: 0
                ],
                'file.txt': [
                    removed: true
                ]
            ]
        ]
    }

    def 'Given a file in a dir, when querying the dir, file is returned'() {
        def file = addFile('dir/file.txt')

        when:
        def result = query('/dir')

        then:
        result == [
            dir: true,
            count: 1,
            files: [
                'file.txt': [
                    size: file.size, 
                    lastModified: lastModified(file)
                ]
            ]
        ]
    }

    def 'Given a dir in a dir, when querying the dir, dir and child-dir is returned'() {
        addDir('dir/child-dir')

        when:
        def result = query('/dir')

        then:
        result == [
            dir: true,
            count: 1,
            files: [
                'child-dir': [
                    dir: true,
                    count: 0
                ]
            ]
        ]
    }

    def 'Given a file in a dir, when querying root, file is not returned'() {
        def file = addFile('dir/file.txt')

        when:
        def result = query('/')

        then:
        result == [
            dir: true,
            count: 1,
            files: [
                'dir': [
                    dir: true,
                    count: 1
                ]
            ]
        ]
    }

    def 'Given a dir, when querying root with incorrect count for dir, dir is returned'() {
        addDir('dir')

        when: 
        def result = query('/', [
            dir: true,
            count: 0,
            files: [
                'dir': [
                    dir: true,
                    count: 1
                ]
            ]
        ])

        then:
        result == [
            dir: true,
            count: 1,
            files: [
                'dir': [
                    dir: true,
                    count: 0
                ]                
            ]
        ]
    }

    def 'Given a dir, when querying root believing dir is a file, dir is returned'() {
        addDir('dir')

        when: 
        def result = query('/', [
            dir: true,
            count: 1,
            files: [
                'dir': [
                    size: 123,
                    lastModified: longTimeAgo
                ]
            ]
        ])

        then:
        result == [
            dir: true,
            count: 1,
            files: [
                'dir': [
                    dir: true,
                    count: 0
                ]                
            ]
        ]
    }

    def 'Given a dir, when querying root with up-to-date count for dir, dir is not returned'() {
        addDir('dir')

        when: 
        def result = query('/', [
            dir: true,
            count: 0,
            files: [
                'dir': [
                    dir: true,
                    count: 0
                ]
            ]
        ])

        then:
        result == [
            dir: true,
            count: 1,
            files: [:]
        ]
    }

    def 'When querying for a non-existing path, removed: true is returned'() {
        when:
        def result = query('/dir')

        then:
        result == [removed: true]
    }

    def 'When querying for a file, file is returned'() {
        def file = addFile('file.txt')

        when:
        def result = query('/file.txt')

        then:
        result == [
            size: file.size, 
            lastModified: lastModified(file)
        ]
    }

    private String longTimeAgo = '2000-01-01 00:00:00'

    private String lastModified(UserFile file) {
        DateTime.toDateTimeString(new Date(file.lastModified))
    }
}
