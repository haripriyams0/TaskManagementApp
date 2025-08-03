const multer = require('multer');
const storage = multer.memoryStorage(); // Store files in memory

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV, XLS, and XLSX files are allowed'), false);
    }
};

module.exports = multer({ storage, fileFilter });