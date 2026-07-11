const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const DynamicForm = require('./models/DynamicForm');
const connectDB = require('./config/db');

const seedForm = async () => {
  try {
    await connectDB();

    const formName = "Master Booking Form";
    
    // Exact columns requested by user
    const columns = [
      "srNo", "name", "age", "gender", "trainClass", "ticketStatus", 
      "advancePayment", "advanceTransactionId", "advanceVerifiedBy", "advancePaymentDate", 
      "remainingPayment", "remainingTransactionId", "remainingVerifiedBy", "remainingPaymentDate", 
      "mobileNumber", "room", "remark"
    ];

    const fields = columns.map((col, index) => {
      let type = 'text';
      let options = [];
      let visible = true;
      let required = false;

      if (col === 'srNo') {
        type = 'text';
      } else if (['gender', 'trainClass', 'ticketStatus', 'room'].includes(col)) {
        type = 'select';
        if (col === 'gender') options = ['Male', 'Female'];
        if (col === 'trainClass') options = ['3AC', '2AC', 'SL'];
        if (col === 'ticketStatus') options = ['Done', 'Pending'];
        if (col === 'room') options = ['1 Room', '2 Room', '3 Room'];
      } else if (col.toLowerCase().includes('date')) {
        type = 'date';
      } else if (col.toLowerCase().includes('payment') || col === 'age') {
        type = 'number';
      } else if (col === 'remark') {
        type = 'textarea';
      }

      if (['name', 'mobileNumber'].includes(col)) {
        required = true;
      }

      return {
        header: col,
        label: col,
        type,
        required,
        visible,
        options,
        order: index
      };
    });

    const formData = {
      name: formName,
      sheetId: "AUTO_GENERATED",
      appsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/REPLACE_WITH_YOUR_URL/exec",
      fields,
      isActive: true
    };

    await DynamicForm.findOneAndDelete({ name: formName });
    const newForm = await DynamicForm.create(formData);

    console.log('✅ Master Booking Form seeded successfully!');
    console.log('Form ID:', newForm._id);
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding form:', error.message);
    process.exit(1);
  }
};

seedForm();
