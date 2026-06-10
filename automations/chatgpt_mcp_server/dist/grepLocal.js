import { spawn } from 'node:child_process';
import { getAllowedRoots, isPathUnderRoots } from './roots.js';
function buildRgArgs(p, searchPath) {
    const args = [];
    const mode = p.output_mode ?? 'content';
    if (mode === 'files_with_matches') {
        args.push('-l', '--color', 'never');
    }
    else if (mode === 'count') {
        args.push('--count-matches', '--color', 'never');
    }
    else {
        if (p['-B'] != null)
            args.push('-B', String(p['-B']));
        if (p['-A'] != null)
            args.push('-A', String(p['-A']));
        if (p['-C'] != null)
            args.push('-C', String(p['-C']));
        args.push('--no-heading', '--line-number', '--color', 'never');
    }
    if (p['-i'])
        args.push('-i');
    if (p.type)
        args.push('--type', p.type);
    if (p.glob)
        args.push('--glob', p.glob);
    if (p.multiline)
        args.push('-U', '--multiline-dotall');
    args.push(p.pattern);
    args.push(searchPath);
    return args;
}
export async function grepLocal(p) {
    const roots = getAllowedRoots();
    const searchPath = p.path?.trim() || roots[0];
    if (!isPathUnderRoots(searchPath, roots)) {
        return `Error: path must be under allowed roots: ${roots.join(', ')}`;
    }
    const args = buildRgArgs(p, searchPath);
    const maxOut = 400_000;
    return await new Promise((resolve) => {
        const child = spawn('rg', args, {
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let out = '';
        let err = '';
        child.stdout?.on('data', (d) => {
            out += d.toString('utf8');
            if (out.length > maxOut + 10_000) {
                child.kill('SIGKILL');
            }
        });
        child.stderr?.on('data', (d) => {
            err += d.toString('utf8');
        });
        child.on('error', (e) => {
            if (e.code === 'ENOENT') {
                resolve('Error: `rg` (ripgrep) not found on PATH. Install: https://github.com/BurntSushi/ripgrep or `winget install BurntSushi.ripgrep`');
            }
            else {
                resolve(`Error spawning rg: ${e.message}`);
            }
        });
        child.on('close', (code) => {
            let text = out;
            if (err.trim())
                text += (text ? '\n' : '') + err.trim();
            if (code !== 0 && !text.trim()) {
                text = `(rg exit ${code})`;
            }
            const lines = text.split(/\r?\n/);
            const offset = Math.max(0, p.offset ?? 0);
            const head = p.head_limit;
            let sliced = lines;
            if (offset)
                sliced = sliced.slice(offset);
            if (head != null && head >= 0)
                sliced = sliced.slice(0, head);
            let result = sliced.join('\n');
            if (lines.length > sliced.length + offset) {
                result += `\n…(truncated; use offset/head_limit)`;
            }
            resolve(result || '(no matches)');
        });
    });
}
