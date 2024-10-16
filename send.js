require('dotenv').config(); // Memuat variabel dari file .env
const Web3 = require('web3');

// Menghubungkan ke jaringan Unichain menggunakan RPC Sepolia
const web3 = new Web3('https://sepolia.unichain.org');

// Mengambil data sensitif dari .env
const senderAddress = process.env.SENDER_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;

// Alamat kontrak token ERC-20
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;

// Mengambil daftar penerima dari .env dan memisahkannya menjadi array berdasarkan baris baru
const recipients = process.env.RECIPIENTS.split('\n').map(address => address.trim()); // Hilangkan spasi ekstra di setiap alamat

// ABI ERC-20 standar untuk transfer token
const tokenABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "type": "function"
    }
];

// Membuat instance kontrak token ERC-20
const tokenContract = new web3.eth.Contract(tokenABI, tokenContractAddress);

// Tentukan jumlah token yang ingin dikirim ke setiap penerima (dalam satuan token, misalnya 1000 token)
const fixedAmount = '1000'; // Mengirim 1000 token ke setiap penerima
const decimals = 18; // Jumlah desimal token ERC-20 (sesuaikan dengan kontrak token)

// Fungsi untuk mengirim token ERC-20 ke banyak alamat
const sendTokens = async () => {
    try {
        const nonceStart = await web3.eth.getTransactionCount(senderAddress, 'latest'); // Mendapatkan nonce awal
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i]; // Setiap alamat penerima

            // Mengonversi jumlah token ke satuan minimal (menggunakan desimal token ERC-20)
            const amountToSend = web3.utils.toBN(fixedAmount).mul(web3.utils.toBN(10).pow(web3.utils.toBN(decimals)));

            // Membuat data transaksi panggilan fungsi `transfer` pada kontrak token ERC-20
            const txData = tokenContract.methods.transfer(recipient, amountToSend).encodeABI();

            // Membuat transaksi
            const tx = {
                from: senderAddress,
                to: tokenContractAddress, // Transaksi dikirimkan ke kontrak token
                data: txData, // Data transaksi panggilan fungsi `transfer`
                gas: 100000, // Gas limit untuk transaksi ERC-20
                nonce: nonceStart + i, // Menambah nonce untuk setiap transaksi
                chainId: 11155111 // ID untuk Sepolia Unichain
            };

            // Menandatangani transaksi
            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

            // Mengirimkan transaksi
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log(`Transaction successful to ${recipient} with hash: ${receipt.transactionHash}`);
        }
    } catch (error) {
        console.error('Error sending tokens: ', error);
    }
};

// Memanggil fungsi untuk mengirim token ERC-20 ke banyak penerima
sendTokens();
