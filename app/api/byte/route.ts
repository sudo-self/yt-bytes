import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

// Ensure downloads directory exists
const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// POST method handler for converting the URL
export async function POST(request: Request) {
    const { url } = await request.json();

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        // Extract the title for naming the file
        const titleCommand = `yt-dlp --get-title "${url}"`;
        const { stdout: title } = await execPromise(titleCommand);
        const trimmedTitle = title.trim().replace(/[\/\\:\*\?"<>\|]/g, ''); // Clean up the title string for filename

        // Download and trim the audio to 20 seconds in MP3 format
        await execPromise(`yt-dlp -x --audio-format mp3 --postprocessor-args "-ss 0 -t 20" -o "${downloadsDir}/${trimmedTitle}.mp3" "${url}"`);

        // Download and trim the audio to 20 seconds in M4A format
        await execPromise(`yt-dlp -x --audio-format m4a --postprocessor-args "-ss 0 -t 20" -o "${downloadsDir}/${trimmedTitle}.m4a" "${url}"`);

        // Rename the M4A file to M4R format (iOS ringtone format)
        const m4aPath = path.join(downloadsDir, `${trimmedTitle}.m4a`);
        const m4rPath = path.join(downloadsDir, `${trimmedTitle}.m4r`);
        if (fs.existsSync(m4aPath)) {
            fs.renameSync(m4aPath, m4rPath);
        } else {
            throw new Error(`M4A file not found: ${m4aPath}`);
        }

        // Construct download links
        const mp3Link = `/downloads/${trimmedTitle}.mp3`;
        const m4rLink = `/downloads/${trimmedTitle}.m4r`;

        return NextResponse.json({ mp3: mp3Link, m4r: m4rLink });
    } catch (error) {
        console.error('Error during download or conversion:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 }); // Type assertion
    }
}















