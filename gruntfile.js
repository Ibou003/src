module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
      copy: {
        build: {
          files: [
            {
              expand: true,
              cwd: "./resources",
              src: ["**"],
              dest: "./dist/resources"
            },
          ]
        }
      },
      ts: {
        app: {
          tsconfig: true,
          files: [{
            src: ["src/\*\*/\*.ts", "!src/.baseDir.ts", "!src/tests/**/*.ts"],
            dest: "./dist"
          }]
        }
      },
      watch: {
        ts: {
          files: ["src/\*\*/\*.ts"],
          tasks: ["ts"]
        },
        views: {
          files: ["views/**/*.pug"],
          tasks: ["copy"]
        }
      },
      availabletasks: {
            tasks: {
                options: {
                    filter: 'exclude',
                    tasks: ['availabletasks', 'tasks']
                }
            }
        }
  
    });
  
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-available-tasks');
    grunt.registerTask('tasks', ['availabletasks']);
    grunt.registerTask("default", [
      "copy",
      "ts"
    ]);
  
  };