// start.js
const { spawn } = require('child_process');

const child = spawn('npm', ['run', 'start'], { stdio: 'inherit', shell: true });

child.on('exit', function(code) {
    process.exit(code);
});
