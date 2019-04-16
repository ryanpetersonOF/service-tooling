import {getRootDirectory} from '../utils/getRootDirectory';

export function createConfig(testType: 'unit'|'int') {
    return {
        rootDir: getRootDirectory(),
        testURL: 'http://localhost/',
        globals: {
            'ts-jest': {
                'tsConfig': '<rootDir>/test/tsconfig.json'
            }
        },
        transform: {
            '^.+\\.tsx?$': '<rootDir>/node_modules/ts-jest'
        },
        testRegex: '\\.unittest\\.ts$',
        modulePaths: [
            '<rootDir>/node_modules'
        ],
        roots: ['<rootDir>', '<rootDir>/test'],
        moduleFileExtensions: [
            'ts',
            'tsx',
            'js',
            'jsx',
            'json',
            'node'
        ],
        reporters: [
            'default',
            [
                'jest-junit', {
                    'outputDirectory': '<rootDir>/dist/test',
                    'outputName': 'results-' + testType + '.xml',
                    'classNameTemplate': (vars: any) => {
                        const filePathTokens = vars.filepath.split('\\');

                        let fileName = filePathTokens[filePathTokens.length - 1];
                        fileName = fileName.split('.')[0];
                        filePathTokens[filePathTokens.length - 1] = fileName;

                        return testType + '.' + filePathTokens.join('.');
                    },
                    'titleTemplate': (vars: any) => {
                        let title;
                        if (vars.classname) {
                            title = vars.classname + ' > ' + vars.title;
                        } else {
                            title = vars.title;
                        }

                        return title.replace(/\./g, '•');
                    },
                    'ancestorSeparator': ' > '
                }
            ]
        ]
    };
}

