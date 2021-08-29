const processFile = require("../middleware/upload");
const { format } = require("util");
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  keyFilename: "cjenm-demo-app-9a9ea6d228eb.json",
});
const bucket = storage.bucket("mp4-bucket");

const upload = async (req, res) => {
  try {
    await processFile(req, res);

    if (!req.file) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on("error", (err) => {
      res.status(500).send({ message: err.message });
    });

    Object.defineProperty(blob, "name", {
      writable: true,
      value: "test_video.webm",
    });

    blobStream.on("finish", async (data) => {
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      );

      try {
        await bucket.file(req.file.originalname).makePublic();
      } catch {
        return res.status(500).send({
          message: `Uploaded the file successfully: ${req.file.originalname}, but public access is denied!`,
          url: publicUrl,
        });
      }

      res.status(200).send({
        message: "Uploaded the file successfully: " + req.file.originalname,
        url: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    console.log(err);

    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
};

const getListFiles = async (req, res) => {
  try {
    const [files] = await bucket.getFiles();
    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file.name,
        url: file.metadata.mediaLink,
      });
    });

    res.status(200).send(fileInfos);
  } catch (err) {
    console.log(err);

    res.status(500).send({
      message: "Unable to read list of files!",
    });
  }
};

const download = async (req, res) => {
  try {
    const [metaData] = await bucket.file(req.params.name).getMetadata();
    console.log(metaData.mediaLink);
    //res.redirect(metaData.mediaLink);
    res.redirect(
      `https://storage.googleapis.com/mp4-bucket/test_json.json?x-goog-signature=15f8fb614bc84327ba1d1d66f1f0df7bf4787c678cc7d3e963ac897770c5c574f3ac540162c4e15445388238744534912e48791a822f97eb4b850294d93823e8894558531b6b5e3815ed7f583630c469ea9aaa4afc02f18f520974a1518101d8fe8400c31f0c9ad71f1e0b9365627ad1c829cead53e479f5afd2b15a9d6d1fed1397872761923a2380ad4e0296de50946a931201b839d1a4971d939ec5a29cc9bf90c8efb770932f917f7015168561bf558b33d13200ec9ee066a23e78f00e90716933719d4e9bd6ca88e74ddd43344f642ea0f3ec1cb8252d20d203067ea5c0962f13ce57a1268ab87167cde4d2ce7169d2d371be2b7e1c9cd997921edbf4a2&x-goog-algorithm=GOOG4-RSA-SHA256&x-goog-credential=gcs-object-download%40cjenm-demo-app.iam.gserviceaccount.com%2F20210829%2Fasia-northeast3%2Fstorage%2Fgoog4_request&x-goog-date=20210829T215117Z&x-goog-expires=3600&x-goog-signedheaders=host`
    );
  } catch (err) {
    res.status(500).send({
      message: "Could not download the file. " + err,
    });
  }
};

module.exports = {
  upload,
  getListFiles,
  download,
};
