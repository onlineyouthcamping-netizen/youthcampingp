const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', '..', 'erpData.json');

const getErpData = () => {
  try {
    if (!fs.existsSync(dataFile)) {
      return { notifications: [], documents: [], recurringTasks: [], mistakes: [], timelines: {} };
    }
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (e) {
    return { notifications: [], documents: [], recurringTasks: [], mistakes: [], timelines: {} };
  }
};

const saveErpData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

// 1. Notifications Center
exports.getNotifications = async (req, res, next) => {
  try {
    const data = getErpData();
    res.json({ success: true, data: data.notifications });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const data = getErpData();
    const { id } = req.params;
    const notif = data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      saveErpData(data);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const data = getErpData();
    const { role } = req.body;
    data.notifications.forEach(n => {
      if (!role || n.module.toLowerCase() === role.toLowerCase() || role === 'superadmin' || role === 'admin') {
        n.read = true;
      }
    });
    saveErpData(data);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// 2. Global Search
exports.searchAll = async (req, res, next) => {
  try {
    const { q = "" } = req.query;
    const term = q.toLowerCase().trim();
    if (!term) {
      return res.json({ success: true, data: {} });
    }

    const data = getErpData();
    const results = {};

    // 1. Bookings Search
    const bookings = [
      { id: "BK-2026-001", name: "Rohan Sharma", trip: "MKA" },
      { id: "BK-4091", name: "Zeel Panchal", trip: "MKA-1" },
      { id: "BK-4092", name: "Vidhi Thummar", trip: "MKB" }
    ];
    const matchBookings = bookings.filter(b => 
      b.id.toLowerCase().includes(term) || 
      b.name.toLowerCase().includes(term) || 
      b.trip.toLowerCase().includes(term)
    ).map(b => ({
      title: `${b.id} - ${b.name} (${b.trip})`,
      path: `/admin/bookings`
    }));
    if (matchBookings.length > 0) results["Bookings"] = matchBookings;

    // 2. Customers Search
    const customers = ["Rohan Sharma", "Rahul Verma", "Vidhi Thummar", "Suresh Chaudhary"];
    const matchCustomers = customers.filter(c => c.toLowerCase().includes(term)).map(c => ({
      title: `${c} (Customer File)`,
      path: `/admin/bookings`
    }));
    if (matchCustomers.length > 0) results["Customers"] = matchCustomers;

    // 3. Trips Search
    const trips = [
      { code: "MKA", title: "Manali Kasol Amritsar" },
      { code: "SPT", title: "Spiti Valley Road Trip" },
      { code: "LAD", title: "Leh Ladakh Bike Trip" }
    ];
    const matchTrips = trips.filter(t => 
      t.code.toLowerCase().includes(term) || 
      t.title.toLowerCase().includes(term)
    ).map(t => ({
      title: `${t.title} (${t.code})`,
      path: `/admin/marketing/overview`
    }));
    if (matchTrips.length > 0) results["Trips"] = matchTrips;

    // 4. Employees
    const employees = [
      { name: "Hemal Patel", role: "Founder" },
      { name: "Suresh Chaudhary", role: "Sales Manager" },
      { name: "Zeel Panchal", role: "Sales Executive" },
      { name: "Vidhi Thummar", role: "Sales Executive" },
      { name: "Neeki Diyali", role: "Operations Manager" }
    ];
    const matchEmployees = employees.filter(e => e.name.toLowerCase().includes(term) || e.role.toLowerCase().includes(term)).map(e => ({
      title: `${e.name} - ${e.role}`,
      path: `/admin/hr?tab=staff`
    }));
    if (matchEmployees.length > 0) results["Employees"] = matchEmployees;

    // 5. Documents
    const matchDocs = data.documents.filter(d => 
      d.name.toLowerCase().includes(term) || 
      d.identifier.toLowerCase().includes(term) || 
      d.category.toLowerCase().includes(term)
    ).map(d => ({
      title: `${d.name} (${d.identifier}) - ${d.category}`,
      path: `/admin/company-documents`
    }));
    if (matchDocs.length > 0) results["Documents"] = matchDocs;

    // 6. Vendors
    const vendors = [
      { name: "TaxiWale", type: "Transport" },
      { name: "Hotel Palace Manali", type: "Hotel" }
    ];
    const matchVendors = vendors.filter(v => v.name.toLowerCase().includes(term) || v.type.toLowerCase().includes(term)).map(v => ({
      title: `${v.name} (${v.type} Vendor)`,
      path: `/admin/vendors`
    }));
    if (matchVendors.length > 0) results["Vendors"] = matchVendors;

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

// 3. Company Documents
exports.getCompanyDocuments = async (req, res, next) => {
  try {
    const data = getErpData();
    res.json({ success: true, data: data.documents });
  } catch (err) {
    next(err);
  }
};

exports.createCompanyDocument = async (req, res, next) => {
  try {
    const { name, identifier, category, type, expiryDate, size } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Document Name and Category are required' });
    }

    const data = getErpData();
    const newDoc = {
      id: `doc_${Date.now()}`,
      name,
      identifier: identifier || 'N/A',
      category,
      type: type || 'PDF',
      uploadedBy: req.user.name || 'System',
      uploadedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      expiryDate: expiryDate || '—',
      status: 'Active',
      size: size || '1.5 MB'
    };

    data.documents.unshift(newDoc);
    saveErpData(data);

    res.status(201).json({ success: true, data: newDoc });
  } catch (err) {
    next(err);
  }
};

exports.deleteCompanyDocument = async (req, res, next) => {
  try {
    const data = getErpData();
    const { id } = req.params;
    data.documents = data.documents.filter(d => d.id !== id);
    saveErpData(data);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// 4. Recurring Tasks
exports.getRecurringTasks = async (req, res, next) => {
  try {
    const data = getErpData();
    res.json({ success: true, data: data.recurringTasks });
  } catch (err) {
    next(err);
  }
};

exports.createRecurringTask = async (req, res, next) => {
  try {
    const { title, schedule, department, assignedTo, dayOfWeek, dayOfMonth } = req.body;
    if (!title || !schedule || !department) {
      return res.status(400).json({ success: false, message: 'Title, Schedule and Department are required' });
    }

    const data = getErpData();
    
    // Compute initial next occurrence
    const today = new Date();
    let nextDate = new Date();
    if (schedule === 'Weekly') {
      nextDate.setDate(today.getDate() + 7);
    } else if (schedule === 'Monthly') {
      nextDate.setMonth(today.getMonth() + 1);
    } else {
      nextDate.setDate(today.getDate() + 1);
    }

    const newTask = {
      id: `rec_${Date.now()}`,
      title,
      schedule,
      department,
      assignedTo: assignedTo || 'System',
      dayOfWeek: dayOfWeek || '',
      dayOfMonth: dayOfMonth || '',
      nextOccurrence: nextDate.toISOString().split('T')[0],
      status: 'Pending'
    };

    data.recurringTasks.push(newTask);
    saveErpData(data);
    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    next(err);
  }
};

exports.completeRecurringTask = async (req, res, next) => {
  try {
    const data = getErpData();
    const { id } = req.params;
    const task = data.recurringTasks.find(t => t.id === id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Set task complete, auto-generate next occurrence
    const currentNext = new Date(task.nextOccurrence);
    let nextOccurrenceDate = new Date(currentNext);

    if (task.schedule === 'Weekly') {
      nextOccurrenceDate.setDate(currentNext.getDate() + 7);
    } else if (task.schedule === 'Monthly') {
      nextOccurrenceDate.setMonth(currentNext.getMonth() + 1);
    } else {
      nextOccurrenceDate.setDate(currentNext.getDate() + 1);
    }

    task.nextOccurrence = nextOccurrenceDate.toISOString().split('T')[0];
    task.status = 'Pending'; // Remains pending for the next cycle

    saveErpData(data);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// 5. Employee Mistakes Log
exports.getEmployeeMistakes = async (req, res, next) => {
  try {
    const data = getErpData();
    res.json({ success: true, data: data.mistakes });
  } catch (err) {
    next(err);
  }
};

exports.logEmployeeMistake = async (req, res, next) => {
  try {
    const { employeeId, employeeName, date, severity, description, actionTaken, managerComment } = req.body;
    if (!employeeName || !severity || !description) {
      return res.status(400).json({ success: false, message: 'Employee name, severity, and description are required' });
    }

    const data = getErpData();
    const newMist = {
      id: `mist_${Date.now()}`,
      employeeId: employeeId || 'EMP-TEMP',
      employeeName,
      date: date || new Date().toISOString().split('T')[0],
      severity,
      description,
      actionTaken: actionTaken || 'Logged',
      managerComment: managerComment || ''
    };

    data.mistakes.unshift(newMist);
    saveErpData(data);
    res.status(201).json({ success: true, data: newMist });
  } catch (err) {
    next(err);
  }
};

// 6. Timelines (Entity & Customer)
exports.getActivityTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = getErpData();
    const timeline = data.timelines[id] || data.timelines['BK-2026-001'] || [];
    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = getErpData();
    const timeline = data.timelines[`customer_${id}`] || data.timelines['customer_rohan'] || [];
    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
};
