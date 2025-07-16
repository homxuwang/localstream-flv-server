const NodeMediaServer = require('node-media-server');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// 配置服务器
const config = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        allow_origin: '*',
        mediaroot: './media'
    },
    trans: {
        ffmpeg: 'C:/ffmpeg/bin/ffmpeg.exe',
        tasks: [
            {
                app: 'live',
                hls: true,
                dash: true,
                ac: 'aac',
                vc: 'libx264',
                hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
            }
        ]
    }
};

const nms = new NodeMediaServer(config);
nms.run();

// 推流函数
function pushLocalFlvFile(filePath, streamKey) {
    const streamUrl = `rtmp://localhost:1935/live/${streamKey}`;

    console.log(`准备推流: ${filePath} -> ${streamUrl}`);

    ffmpeg(filePath)
        .inputOptions('-re')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions('-preset ultrafast')
        .outputOptions('-tune zerolatency')
        .outputOptions('-f flv')
        .output(streamUrl)
        .on('start', (commandLine) => {
            console.log(`推流命令执行: ${commandLine}`);
        })
        .on('progress', (progress) => {
            console.log(`推流进度: ${progress.percent}%`);
        })
        .on('error', (err) => {
            console.log(`推流错误: ${err.message}`);
        })
        .on('end', () => {
            console.log('推流完成');
        })
        .run();
}

// 延迟推流，确保服务器完全启动
setTimeout(() => {
    pushLocalFlvFile('./media/test.flv', 'stream1');
}, 2000);