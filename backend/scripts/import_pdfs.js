const fs = require('fs');
const path = require('path');
const PDFParser = require("pdf2json");
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const prisma = new PrismaClient();

function extractDateFromFilename(filename) {
    const match = filename.match(/(\d{1,2})\s+([A-Za-z]+)/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const monthStr = match[2].toUpperCase().substring(0, 3);
        const months = {
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
            'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        };
        const month = months[monthStr];
        if (month) {
            return `2026-${month}-${day}`;
        }
    }
    return null;
}

const generateBookingId = async () => {
    const uniqueNum = Math.floor(10000 + Math.random() * 90000);
    return `YB-${uniqueNum}`;
};

function processText(text) {
    const lines = text.split('\n');
    const rows = [];
    const regex = /^(\d+)\s+([A-Za-z\s]+?)\s+(\d{1,2})\s+(MALE|FEMALE|Male|Female)\s+([0-9A-Za-z]+)?(.*?)(?:\s*)(\d{10})(.*)$/;
    
    for (let line of lines) {
        line = line.trim();
        const match = line.match(regex);
        if (match) {
            const srNo = match[1].trim();
            const name = match[2].trim();
            const age = Number(match[3].trim());
            const gender = match[4].trim().toUpperCase();
            const train = match[5] ? match[5].trim() : '';
            const paymentStr = match[6].trim();
            const mobile = match[7].trim();
            const remarkRaw = match[8].trim();
            
            let advancePaymentAmount = 0;
            let remainingPaymentAmount = 0;
            let advanceTransactionId = '';
            let remainingTransactionId = '';
            
            let advancePaymentStr = '';
            let remainingPaymentStr = '';
            
            const amountMatches = [...paymentStr.matchAll(/([\d,]+)\/-/g)];
            if (amountMatches.length > 0) {
                advancePaymentAmount = parseInt(amountMatches[0][1].replace(/,/g, ''));
                advancePaymentStr = amountMatches[0][0];
            }
            if (amountMatches.length > 1) {
                remainingPaymentAmount = parseInt(amountMatches[1][1].replace(/,/g, ''));
                remainingPaymentStr = amountMatches[1][0];
            }
            
            const dateMatch = paymentStr.match(/\d{2}\/\d{2}\/\d{4}/);
            const advancePaymentDate = dateMatch ? dateMatch[0] : null;
            
            if (advancePaymentAmount > 0) {
                const firstAmtIndex = paymentStr.indexOf(advancePaymentStr);
                const startTxn = firstAmtIndex + advancePaymentStr.length;
                let endTxn = paymentStr.length;
                if (dateMatch) {
                    endTxn = paymentStr.indexOf(dateMatch[0]);
                } else if (amountMatches.length > 1) {
                    endTxn = paymentStr.indexOf(remainingPaymentStr);
                }
                advanceTransactionId = paymentStr.substring(startTxn, endTxn).trim();
            }
            
            if (remainingPaymentAmount > 0) {
                const secondAmtIndex = paymentStr.indexOf(remainingPaymentStr);
                const startRemTxn = secondAmtIndex + remainingPaymentStr.length;
                remainingTransactionId = paymentStr.substring(startRemTxn).trim();
            }

            rows.push({
                srNo, name, age, gender, train, mobile, 
                advancePaymentAmount, advancePaymentDate, advanceTransactionId, 
                remainingPaymentAmount, remainingTransactionId, room: remarkRaw
            });
        }
    }
    return rows;
}

function parsePdfFile(filePath) {
    return new Promise((resolve, reject) => {
        let pdfParser = new PDFParser(this, 1);
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            const text = pdfParser.getRawTextContent();
            const rows = processText(text);
            resolve(rows);
        });
        pdfParser.loadPDF(filePath);
    });
}

async function processFile(filePath) {
    console.log(`\nProcessing: ${filePath}`);
    const filename = path.basename(filePath);
    
    let tripId = 'MKA-1';
    let tripName = 'Manali Kasol Amritsar Backpacking Trip';
    if (filename.toUpperCase().includes('SPITI')) {
        tripId = 'SPT-1';
        tripName = 'Spiti Valley Road Trip';
    }

    const departureDate = extractDateFromFilename(filename);
    console.log(`Matched Trip: ${tripId}, Departure Date: ${departureDate}`);

    let rows = [];
    try {
        rows = await parsePdfFile(filePath);
    } catch (e) {
        console.error("Failed to parse PDF", e);
        return;
    }

    console.log(`Extracted ${rows.length} valid passenger rows.`);

    // Grouping logic (same as before)
    const groups = [];
    rows.forEach(row => {
        const identifier = row.advanceTransactionId || row.remainingTransactionId || row.mobile || Math.random().toString();
        let existingGroup = groups.find(g => 
            (g.advancePayment?.transactionId && g.advancePayment.transactionId === row.advanceTransactionId && row.advanceTransactionId) ||
            (g.remainingPayment?.transactionId && g.remainingPayment.transactionId === row.remainingTransactionId && row.remainingTransactionId) ||
            (g.passengers[0]?.mobile && g.passengers[0].mobile === row.mobile && row.mobile)
        );

        if (!existingGroup) {
            existingGroup = {
                passengers: [],
                advancePayment: row.advancePaymentAmount ? { amount: row.advancePaymentAmount, transactionId: row.advanceTransactionId, date: row.advancePaymentDate } : null,
                remainingPayment: row.remainingPaymentAmount && row.remainingTransactionId ? { amount: row.remainingPaymentAmount, transactionId: row.remainingTransactionId, date: null } : null,
                totalRemainingAmount: row.remainingPaymentAmount || 0
            };
            groups.push(existingGroup);
        }
        existingGroup.passengers.push(row);
    });

    console.log(`Grouped into ${groups.length} bookings.`);

    let imported = 0;
    let skipped = 0;

    for (const group of groups) {
        const lead = group.passengers[0];
        
        const orConditions = [];
        if (lead.mobile) orConditions.push({ phone: { contains: lead.mobile } });
        if (lead.mobile) orConditions.push({ mobile: { contains: lead.mobile } });
        if (lead.name && departureDate) {
            orConditions.push({ name: { equals: lead.name, mode: "insensitive" }, tripId, departureDate: new Date(departureDate) });
        }

        let isDuplicate = false;
        if (orConditions.length > 0) {
            const existing = await prisma.booking.findFirst({ where: { OR: orConditions } });
            if (existing) isDuplicate = true;
        }

        const txnIds = [];
        if (group.advancePayment?.transactionId) txnIds.push(group.advancePayment.transactionId);
        if (group.remainingPayment?.transactionId) txnIds.push(group.remainingPayment.transactionId);
        
        if (txnIds.length > 0) {
            const existingPay = await prisma.opsClientPayment.findFirst({ where: { transactionId: { in: txnIds } } });
            if (existingPay) isDuplicate = true;
        }

        if (isDuplicate) {
            console.log(`[SKIP] Duplicate detected for ${lead.name} (${lead.mobile || 'no-mobile'})`);
            skipped++;
            continue;
        }

        const bookingId = await generateBookingId();
        const advanceAmount = Number(group.advancePayment?.amount) || 0;
        const totalRemaining = group.totalRemainingAmount || 0;
        const remainingPaidAmount = Number(group.remainingPayment?.amount) || 0;
        
        const totalAmount = advanceAmount + totalRemaining;
        const advancePaid = advanceAmount + remainingPaidAmount;
        const remainingAmount = totalAmount - advancePaid;

        try {
            await prisma.$transaction(async (tx) => {
                const newBooking = await tx.booking.create({
                    data: {
                        tenantId: 'default',
                        bookingId,
                        tripId,
                        tripName,
                        status: "confirmed",
                        name: lead.name,
                        phone: lead.mobile || "0000000000",
                        mobile: lead.mobile,
                        numberOfTravelers: group.passengers.length,
                        amount: totalAmount,
                        totalAmount: totalAmount,
                        advancePaid: advancePaid,
                        remainingAmount: remainingAmount,
                        paymentMode: "Import",
                        paymentStatus: remainingAmount > 0 ? "Partial" : "Paid",
                        departureDate: departureDate ? new Date(departureDate) : null,
                        adminNotes: `Imported via script from ${filename}`,
                        passengers: group.passengers.map((p, idx) => ({
                            id: `p-${idx}`,
                            name: p.name,
                            age: p.age,
                            gender: p.gender,
                            trainOption: p.train || null,
                            roomSharing: p.room || null,
                            ticketStatus: p.ticket || null,
                            remarks: p.room || null,
                        }))
                    }
                });

                if (group.advancePayment && advanceAmount > 0) {
                    await tx.opsClientPayment.create({
                        data: {
                            tenantId: 'default',
                            bookingId: newBooking.bookingId,
                            amount: advanceAmount,
                            paymentMode: "Imported",
                            transactionId: group.advancePayment.transactionId || null,
                            paymentDate: new Date(),
                            status: "Pending Verification",
                            approvalStatus: "PENDING",
                            proofFileName: filename,
                            proofFileType: "IMPORT",
                            collectedBy: "Script Importer"
                        }
                    });
                }

                if (group.remainingPayment && remainingPaidAmount > 0) {
                    await tx.opsClientPayment.create({
                        data: {
                            tenantId: 'default',
                            bookingId: newBooking.bookingId,
                            amount: remainingPaidAmount,
                            paymentMode: "Imported",
                            transactionId: group.remainingPayment.transactionId || null,
                            paymentDate: new Date(),
                            status: "Pending Verification",
                            approvalStatus: "PENDING",
                            proofFileName: filename,
                            proofFileType: "IMPORT",
                            collectedBy: "Script Importer"
                        }
                    });
                }
            });
            imported++;
            console.log(`[SUCCESS] Imported ${lead.name} (${group.passengers.length} pax) -> ${bookingId}`);
        } catch (err) {
            console.error(`[ERROR] Failed to import ${lead.name}:`, err.message);
        }
    }

    console.log(`Finished ${filename}: Imported ${imported}, Skipped ${skipped}`);
}

async function main() {
    const downloadsDir = '/Users/parthpatel/Downloads';
    const files = fs.readdirSync(downloadsDir)
        .filter(f => f.startsWith('MANALI KASOL APRIL 2026 TO JULY 2026') && f.endsWith('.pdf'))
        .map(f => path.join(downloadsDir, f));

    console.log(`Found ${files.length} PDFs to process.`);

    for (const file of files) {
        await processFile(file);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
