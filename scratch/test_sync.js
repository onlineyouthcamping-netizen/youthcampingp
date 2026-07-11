// Using native fetch

const url = 'https://script.google.com/macros/s/AKfycbx3WdPMKS-0bypsOosT3NYdEqpOBegKmDX2u3cEJ1O_UFe5xgCzY2992iCmijBm6r0X/exec';

const data = {
  tripName: "Manual Test",
  date: "2026-05-01",
  name: "Manual Tester",
  phone: "1112223333",
  email: "manual@test.com",
  participants: 1,
  roomSharing: "Triple",
  trainOption: "No",
  participantsList: [],
  timestamp: new Date().toISOString()
};

console.log('Sending to:', url);

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  redirect: 'follow'
})
.then(res => res.text())
.then(text => {
  console.log('Response:', text);
})
.catch(err => {
  console.error('Error:', err);
});
