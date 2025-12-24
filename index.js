const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, serverTimestamp } = require('firebase/firestore');

const app = express();
app.use(express.json());

// --- ដាក់ Firebase Config របស់អ្នកនៅទីនេះ ---
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:..."
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

app.post('/api/aba-webhook', async (req, res) => {
    try {
        const body = req.body;
        const messageText = body.message ? body.message.text : "";
        console.log("សារទទួលបានពី Telegram:", messageText);

        // ឆែករកលេខ 9.99 ក្នុងសារបង់លុយរបស់ ABA
        if (messageText.includes("9.99")) {
            // ស្វែងរក User ដែលមាន status "pending" និង pendingAmount "$9.99"
            const userQuery = query(
                collection(db, "users"), 
                where("status", "==", "pending"),
                where("pendingAmount", "==", "$9.99")
            );

            const querySnapshot = await getDocs(userQuery);
            
            if (querySnapshot.empty) {
                console.log("រកមិនឃើញ User ដែលត្រូវនឹងលក្ខខណ្ឌក្នុង Firebase ទេ");
                return res.status(200).send("No pending user found");
            }

            // ធ្វើការ Update Status ទៅជា "paid" ភ្លាមៗ
            for (const docSnap of querySnapshot.docs) {
                await updateDoc(docSnap.ref, { 
                    status: "paid",
                    paidAt: serverTimestamp() // កត់ត្រាម៉ោងដែលបង់រួច
                });
                console.log("Update ជោគជ័យសម្រាប់ ID:", docSnap.id);
            }
            return res.status(200).send("OK: Firebase Updated");
        }
        res.status(200).send("Not a payment message");
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send(error.message);
    }
});

module.exports = app;
