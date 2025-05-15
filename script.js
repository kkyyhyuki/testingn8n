document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotContainer = document.getElementById('chatbot-container');
    const closeBtn = chatbotContainer.querySelector('.close-btn');
    const messagesDiv = document.getElementById('chatbot-messages');
    const inputField = document.getElementById('chatbot-input');
    const sendButton = document.getElementById('chatbot-send-button');

    // === URL Webhook n8n Anda - GANTI DENGAN LINK BARU INI ===
    const n8nWebhookUrl = 'https://playground.naratel.net.id/webhook/195a7dfd-3234-47c4-a442-314a0ccbd538/chat';
    console.log('Chatbot script loaded. Webhook URL:', n8nWebhookUrl);

    // Fungsi untuk menampilkan/menyembunyikan widget
    chatbotToggle.addEventListener('click', () => {
        const isActive = chatbotContainer.classList.toggle('active');
        console.log('Chatbot toggle clicked. Is active:', isActive);
        if (isActive) {
            inputField.focus();
        }
    });

    // Fungsi untuk menutup widget
    closeBtn.addEventListener('click', () => {
        console.log('Close button clicked.');
        chatbotContainer.classList.remove('active');
    });

    // Fungsi untuk menambahkan pesan ke tampilan
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add(sender + '-message'); // 'user-message' atau 'bot-message'
        // Untuk keamanan, gunakan textContent agar HTML tidak di-render jika ada di pesan
        messageElement.textContent = text;
        messagesDiv.appendChild(messageElement);

        // Scroll ke bawah secara otomatis
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        console.log(`Message added: [${sender}] ${text}`);
    }

    // Fungsi untuk mengirim pesan ke n8n
    async function sendMessageToN8n(message) {
        console.log('Attempting to send message:', message);
        // Tambahkan pesan 'user' ke tampilan
        addMessage(message, 'user');

        // Nonaktifkan input dan tombol kirim sementara
        inputField.disabled = true;
        sendButton.disabled = true;
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('bot-message'); // Gunakan gaya bot
        loadingMessage.textContent = 'Mengetik...'; // Indikator loading
        loadingMessage.id = 'loading-indicator'; // Beri ID agar mudah dihapus
        messagesDiv.appendChild(loadingMessage);
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll ke loading
        console.log('Added loading indicator.');

        try {
            console.log('Sending POST request to:', n8nWebhookUrl);
            const response = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message }) // Kirim pesan dalam format JSON
            });

            console.log('Received response object:', response);

            // Hapus indikator loading sebelum memproses response
            const loadingEl = document.getElementById('loading-indicator');
            if (loadingEl) {
                messagesDiv.removeChild(loadingEl);
                console.log('Removed loading indicator.');
            }


            if (!response.ok) {
                // Jika respons tidak OK (misal: 404, 500)
                console.error(`HTTP error! status: ${response.status}`);
                // Coba baca body error jika ada
                try {
                    const errorBody = await response.text();
                    console.error('Error response body:', errorBody);
                     throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody.substring(0, 100)}...`); // Batasi panjang body error
                } catch (e) {
                     console.error('Could not read error response body.', e);
                     throw new Error(`HTTP error! status: ${response.status}`);
                }

            }

            // Asumsikan n8n merespons dengan JSON
            const data = await response.json();
            console.log('Received JSON data from n8n:', data);

            // Pastikan ada key 'response' di JSON dari n8n
            if (data && typeof data.response === 'string') { // Pastikan data.response ada dan berupa string
                // Tambahkan pesan 'bot' dari n8n ke tampilan
                addMessage(data.response, 'bot');
                console.log('Displayed bot message from response.data.response');
            } else {
                 // Jika n8n tidak mengirim 'response' key atau formatnya salah
                 addMessage('Maaf, ada masalah dengan format respons dari server.', 'bot');
                 console.error('Unexpected response format from n8n. Expected { "response": "..." }', data);
            }


        } catch (error) {
            // Menangkap error dari fetch itu sendiri (jaringan, CORS, dll.) atau dari throw di atas
             console.error('Error during fetch or processing:', error);

             // Hapus indikator loading jika masih ada karena error
             const loadingEl = document.getElementById('loading-indicator');
             if (loadingEl) {
                 messagesDiv.removeChild(loadingEl);
                 console.log('Removed loading indicator in catch block.');
             }

            // Tampilkan pesan error generik
            // Gunakan error.message jika ada, jika tidak, fallback ke pesan default
            const errorMessage = error.message && error.message !== 'Failed to fetch'
                                 ? error.message
                                 : 'Tidak dapat terhubung dengan chatbot.';
            addMessage(`Maaf, terjadi kesalahan. (${errorMessage})`, 'bot');
        } finally {
            // Aktifkan kembali input dan tombol kirim
            inputField.disabled = false;
            sendButton.disabled = false;
            inputField.focus(); // Fokus kembali ke input
            console.log('Input/Send button enabled.');
        }
    }

    // Event listener untuk tombol Kirim
    sendButton.addEventListener('click', () => {
        const message = inputField.value.trim(); // Ambil pesan dan hapus spasi di awal/akhir
        if (message) { // Pastikan pesan tidak kosong
            sendMessageToN8n(message);
            inputField.value = ''; // Bersihkan input field
        }
    });

    // Event listener untuk tombol Enter di input field
    inputField.addEventListener('keypress', (event) => {
        // Periksa apakah tombol yang ditekan adalah 'Enter' (keyCode 13)
        if (event.key === 'Enter') {
            event.preventDefault(); // Cegah default action (seperti submit form)
            sendButton.click(); // Picu klik tombol Kirim
        }
    });

    // Log pesan awal bot (sudah ada di HTML, tapi bisa juga ditambahkan via JS)
    // addMessage('Halo! Ada yang bisa saya bantu mengenai layanan internet CitraNet?', 'bot');
});