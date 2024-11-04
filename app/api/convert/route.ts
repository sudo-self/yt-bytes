export async function POST(request: NextRequest) {
  try {
    await ensureTempDirExists();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const format = formData.get("format") as string | null;

    if (!file || !(file instanceof Blob)) {
      console.error("No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!format) {
      console.error("No output format provided");
      return NextResponse.json({ error: "No output format provided" }, { status: 400 });
    }

    const tempInputPath = path.join(tempDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    // Write the file to the temporary input path
    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(tempInputPath);
      writeStream.on("finish", resolve);
      writeStream.on("error", (err) => {
        console.error("Error writing file:", err);
        reject(err);
      });
      writeStream.end(buffer);
    });

    const tempOutputPath = path.join(tempDir, `${path.parse(file.name).name}.${format}`);

    // Convert the file using FFmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .audioBitrate('128k')
        .toFormat(format === 'm4r' ? 'ipod' : format)
        .on("end", async () => {
          try {
            await fsPromises.unlink(tempInputPath); // Clean up the input file
            resolve();
          } catch (unlinkError) {
            console.error('Error cleaning up input file:', unlinkError);
            reject(unlinkError);
          }
        })
        .on("error", (err) => {
          console.error('FFmpeg error:', err.message);
          reject(err);
        })
        .save(tempOutputPath);
    });

    // Stream the converted file
    const convertedStream = createReadStream(tempOutputPath);

    return new Promise<NextResponse>((resolve, reject) => {
      const chunks: Buffer[] = [];
      convertedStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      convertedStream.on("end", async () => {
        const convertedBuffer = Buffer.concat(chunks);
        
        // Clean up the output file
        await fsPromises.unlink(tempOutputPath).catch(err => console.error('Error cleaning up output file:', err));

        resolve(
          new NextResponse(convertedBuffer, {
            headers: {
              "Content-Type": `audio/${format === 'm4r' ? 'mp4' : format}`,
              "Content-Disposition": `attachment; filename=${file.name.replace(
                path.extname(file.name),
                `.${format}`
              )}`,
            },
          })
        );
      });

      convertedStream.on("error", (err) => {
        console.error('Error reading converted stream:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error converting file:", error);
    return NextResponse.json({ error: "Error converting file" }, { status: 500 });
  }
}


