var express = require("express");
var router = express.Router();
const studentModel = require("../model/student.model");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const path = require("path");

//setting folder which contain image
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/images");
    },
    filename: (req, file, cb) => {
        cb(null, `img-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(new Error("File is not supported"), false);
    }
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});

//Index page
router.get("/", async (req, res) => {
    const students = await studentModel.find();
    res.render("student/index", { students });
});


//Create page
router.get("/create", (req, res) => {
    return res.render("student/create");
});

router.post("/create", [
    upload.single("photo"),
    body('name').notEmpty().withMessage('Name is required'),
    body('age').isInt({ gt: 0 }).withMessage('Age is greater than 0'),
    body('email').isEmail().withMessage('Email is not valid'),
    body('bio').isLength({ min: 10 }).withMessage('Bio must be at least 10 char'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("student/create", { errors: errors.errors });
    }
    if (!req.file) {
        return res.render("student/create", { errors: [{ msg: "Image is required", path: "image" }] });
    }

    const { name, age, email, bio } = req.body;
    const photoUrl = req.file ? req.file.filename : "";
    const student = { name, age, email, bio, photoUrl };
    await studentModel.create(student);
    console.log("toi day")
    return res.redirect("/student");
})


//update
router.get("/update/:id", async (req, res) => {
    const studentId = req.params.id;
    const student = await studentModel.findById(studentId);
    res.render("student/update", { student });
})

router.post("/update/:id",
    upload.single("photo"),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('age').isInt({ gt: 0 }).withMessage('Age is greater than 0'),
        body('email').isEmail().withMessage('Email is not valid'),
        body('bio').isLength({ min: 10 }).withMessage('Bio must be at least 10 char'),
    ], async (req, res) => {
        const studentId = req.params.id;
        const student = await studentModel.findById(studentId);

        const errors = validationResult(req);
        console.log(errors);
        if (!errors.isEmpty()) {
            return res.render("student/update", { student, errors: errors.errors });
        }
        if (!req.file) {
            return res.render("student/update", { student, errors: [{ msg: "Image is required", path: "image" }] });
        }


        const { name, age, email, bio } = req.body;
        const photoUrl = req.file ? req.file.filename : "";



        student.name = name ?? student.name;
        student.age = age ?? student.age;
        student.email = email ?? student.email;
        student.bio = bio ?? student.bio;
        student.photoUrl = photoUrl ?? student.photoUrl;


        await student.save();
        return res.redirect("/student");
    })

//search

router.get("/search", async (req, res) => {
    const keyword = req.query.keyword;
    const students = await studentModel.find({ name: new RegExp(keyword) });
    res.render("student/index", { students });
});
module.exports = router;