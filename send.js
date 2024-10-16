const Web3 = require('web3');
const fs = require('fs');
require('dotenv').config(); // Menggunakan dotenv untuk mengambil data dari .env

// Menghubungkan ke jaringan Unichain menggunakan RPC URL dari file .env
const web3 = new Web3(process.env.RPC_URL);

// Alamat pengirim dan kunci privat dari file .env
const senderAddress = process.env.SENDER_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;

// Mengambil daftar penerima dari file JSON
const recipients = JSON.parse(fs.readFileSync('recipients.json', 'utf-8'));

// Fungsi untuk mengirim token ke banyak alamat
const sendTokens = async () => {
    try {
        const nonceStart = await web3.eth.getTransactionCount(senderAddress, 'latest'); // Mendapatkan nonce awal
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const amountToSend = web3.utils.toWei(recipient.amount, 'ether'); // Mengonversi jumlah token ke wei

            // Membuat transaksi untuk setiap penerima
            const tx = {
                from: senderAddress,
                to: recipient.address,
                value: amountToSend,
                gas: 21000, // Gas limit untuk transaksi sederhana
                nonce: nonceStart + i, // Menambah nonce untuk setiap transaksi
                chainId: 11155111 // ID untuk Sepolia Unichain
            };

            // Menandatangani transaksi
            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

            // Mengirimkan transaksi
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log(`Transaction successful to ${recipient.address} with hash: ${receipt.transactionHash}`);
        }
    } catch (error) {
        console.error('Error sending tokens: ', error);
    }
};

// Memanggil fungsi untuk mengirim token ke banyak penerima
sendTokens();
