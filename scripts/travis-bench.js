const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const fetch = require('node-fetch');

const username = process.env.BROWSER_USERNAME;
const accessKey = process.env.BROWSER_KEY;
const build = process.env.TRAVIS_BUILD_NUMBER;
const pullRequest = process.env.TRAVIS_PULL_REQUEST;

console.log(username.length, accessKey ? accessKey.length : typeof accessKey);

if (pullRequest === 'false') {
    console.log('Benchmark skipped.');
    process.exit(0);
}

const outputFile = path.join(process.cwd(), 'tmp', 'output.txt');

const defaultCap = {
    'browserstack.user': username,
    'browserstack.key': accessKey,
    'browserstack.debug': 'true',
    build
};

const args = [
    `--capabilities=${JSON.stringify([
/*            {
                browserName: 'safari',
                version: '10.0',
                platform: 'macOS 10.12',
            },
            {
                browserName: 'internet explorer',
                version: '11.103',
                platform: 'Windows 10',
            },
*/
            {
                browserName: 'Firefox',
                os: 'Windows',
                os_version: '10',
            },
            {
                browserName: 'chrome',
                os: 'Windows',
                os_version: '10',
            },
    ].map(cap => Object.assign(cap, defaultCap)))}`,
    `--server=http://hub-cloud.browserstack.com/wd/hub`,
    `--custom=${process.cwd()}`,
    `--output=${outputFile}`,
    `--iterations=15`,
];

try {
    childProcess.execFileSync(path.join(__dirname, 'benchmark.sh'), args, {
        cwd: process.cwd(),
        stdio: 'inherit'
    });
} catch (err) {
    console.error('An error occurred running the benchmark!');
}

if (!fs.existsSync(outputFile)) {
    throw new Error('Benchmark failed.');
}

const githubUsername = 'Svelte-Bot';
const id = 29757693;
const githubToken = process.env.GITHUB_ACCESS_TOKEN;
console.log('GitHub token is of type', typeof githubToken);
const headers = {
    'Authorization': `token ${githubToken}`
};

fetch(`https://api.github.com/repos/sveltejs/svelte/issues/${pullRequest}/comments`)
    .then(res => res.json())
    .then(res => {
        let addComment = false;
        let editId = null;
        console.log('[DEBUG]', res);
        if (res.length === 0) {
            addComment = true;
        } else if (res[res.length - 1].user.id === id) {
            addComment = true;
            editId = res[res.length - 1].id;
        } else {
            addComment = true;
        }

        if (addComment) {
            const contents = '<details><summary>Benchmark Results</summary>```' + fs.readFileSync(outputFile).replace(/[\r\n]+/g, '\n') + '```</details>';
            let action;
            if (editId === null) {
                action = fetch(`https://api.github.com/repos/sveltejs/svelte/issues/${pullRequest}/comments`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        body: contents
                    })
                });
            } else {
                action = fetch(`https://api.github.com/repos/sveltejs/svelte/issues/comments/${editId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        body: contents
                    })
                });
            }
            return action.then(res => res.json()).then(res => console.log('[DEBUG]', res));
        }
    });
