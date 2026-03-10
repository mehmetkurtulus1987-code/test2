/* ============================================================
   GÜNERİ TEKNİK - TÜMÜ BİR ARADA (2026)
   ============================================================ */

// --- 1. GÜVENLİK AYARLARI (Kopyalama Engelleme) ---
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function (e) {
    if (e.ctrlKey && [67, 86, 85, 83].includes(e.keyCode)) return false;
    if (e.keyCode === 123) return false;
};

// --- 2. DİNAMİK ALANLARI GÖSTER/GİZLE ---
function toggleFields() {
    const serviceSelect = document.getElementById('serviceSelect');
    const brandSelect = document.getElementById('brandSelect');
    const warrantySelect = document.getElementById('warrantySelect');
    const manualBrandGroup = document.getElementById('manualBrandGroup');
    const submitBtn = document.querySelector('.btn-submit');

    if (!serviceSelect || !brandSelect) return;

    const service = serviceSelect.value;
    const brand = brandSelect.value;
    const warranty = warrantySelect ? warrantySelect.value : "";

    // --- DİĞER SEÇENEĞİ KONTROLÜ ---
    let otherOption = brandSelect.querySelector('option[value="Diger"]');
    if (!otherOption) {
        otherOption = document.createElement('option');
        otherOption.value = "Diger";
        otherOption.text = "Diğer";
        brandSelect.add(otherOption);
    }

    const markalar = {
        "Maktek": "0850 441 42 00", "Sanica": "0850 460 66 88",
        "Ariston": "444 92 31", "Hexel": "0850 346 29 29", "Dizayn": "0850 290 3434"
    };

    let alertBox = document.getElementById('warrantyAlert');
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'warrantyAlert';
        alertBox.style.cssText = "background:#fff3cd; color:#856404; padding:18px; border-radius:10px; margin:20px 0; border:2px solid #ffeeba; font-weight:500; text-align:center;";
        const messageInput = document.querySelector('textarea');
        messageInput.parentNode.insertBefore(alertBox, messageInput);
    }

    // Varsayılan Gizlemeler
    alertBox.style.display = 'none';
    submitBtn.style.display = 'block';
    if (manualBrandGroup) manualBrandGroup.style.display = 'none';

    if (service === 'servis') {
        otherOption.style.display = 'none'; // Teknik serviste "Diğer" yasak
        if (brand === 'Diger') brandSelect.value = "";

        brandSelect.style.display = 'block';
        warrantySelect.style.display = 'block';

        if (warranty === 'evet' && brand && brand !== "") {
            const numara = markalar[brand] || "yetkili merkezi";
            alertBox.innerHTML = `⚠️ <strong>DİKKAT:</strong> ${brand} cihazınızın garantisi devam ediyorsa önce <strong>${numara}</strong> hattını aramalısınız.`;
            alertBox.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }
    else if (service === 'bakim') {
        otherOption.style.display = 'block';
        brandSelect.style.display = 'block';
        warrantySelect.style.display = 'none';

        // EĞER "DİĞER" SEÇİLİYSE MANUEL GİRİŞİ GÖSTER
        if (brand === 'Diger' && manualBrandGroup) {
            manualBrandGroup.style.display = 'block';
        }
    }
    else {
        brandSelect.style.display = 'none';
        warrantySelect.style.display = 'none';
    }
}

// --- 3. SAYFA YÜKLENDİĞİNDE TETİKLENENLER ---
document.addEventListener('DOMContentLoaded', () => {

    const cForm = document.getElementById('contactForm');

    if (cForm) {
        // Yeni HTML'de ID olmadığı için TYPE ve sıralamaya göre yakalıyoruz
        const nameInput = cForm.querySelector('input[type="text"]');
        const phoneInput = cForm.querySelector('input[type="tel"]');
        const serviceSelect = document.getElementById('serviceSelect');
        const brandSelect = document.getElementById('brandSelect');
        const warrantySelect = document.getElementById('warrantySelect');
        const messageInput = cForm.querySelector('textarea');

        // --- TELEFON KISITLAMASI (HARF YAZILMASINI ENGELLER) ---
        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
                // Rakam olmayan her şeyi anında siler
                this.value = this.value.replace(/[^0-9]/g, '');
                // 11 haneden fazlasını kestirir
                if (this.value.length > 11) this.value = this.value.slice(0, 11);
            });
        }

        // --- FORM GÖNDERME ---
        cForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const service = serviceSelect.value;
            const brand = (brandSelect && brandSelect.style.display !== 'none') ? brandSelect.value : "Belirtilmedi";
            const message = messageInput.value.trim();

            if (!phone.startsWith('0') || phone.length !== 11) {
                alert("Lütfen 11 haneli ve 0 ile başlayan telefon numaranızı giriniz.");
                return;
            }

            // Google Sheets'e Kayıt (Arka Plan)
            const scriptURL = 'https://script.google.com/macros/s/AKfycbwTcZuAo3VF1PZozQr2MTA9jwD2r_4PpjwulnWX4wz1vlMEW57qZZZkB9o5gtiP0kOpMQ/exec';
            const formData = new FormData();
            formData.append('name', name);
            formData.append('phone', phone);
            formData.append('service', service);
            formData.append('brand', brand);
            formData.append('message', message);

            fetch(scriptURL, { method: 'POST', body: formData }).catch(err => console.log(err));

            // WhatsApp Yönlendirme
            const wpMetin = `*Güneri Teknik Web Talebi*%0A*Müşteri:* ${name}%0A*Tel:* ${phone}%0A*Hizmet:* ${service}%0A*Cihaz:* ${brand}%0A*Mesaj:* ${message}`;
            window.open(`https://wa.me/905376183344?text=${wpMetin}`, '_blank');

            // Başarı Mesajı
            alert("Talebiniz alınmıştır. WhatsApp üzerinden de iletiliyor...");
            cForm.reset();
            toggleFields();
        });
    }

    // Yedek Parça sayfasındaysak verileri çek
    if (document.querySelector('.parts-grid')) {
        yedekParcalariYukle();
    }
});

// --- 4. YEDEK PARÇA YÜKLEME FONKSİYONU ---
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIuvoE6Mdx-csDbY7ECBAadzc2d4R9SB3NFdcZy0CVoRP5LuhYl-ogCpGnPtXvnnSBi6_9FNTZQ-mA/pub?gid=0&single=true&output=csv';

async function yedekParcalariYukle() {
    try {
        const response = await fetch(sheetURL);
        const data = await response.text();
        const rows = data.split(/\r?\n/).slice(1);
        const grids = document.querySelectorAll('.parts-grid');
        grids.forEach(g => g.innerHTML = '');

        rows.forEach((row) => {
            const cols = row.split(/[;,]/);
            if (cols.length < 7) return;
            const [isim, marka, klasor, kategoriID, fiyat, stok, resimAdi] = cols.map(c => c.trim().replace(/"/g, ''));
            const temizID = kategoriID.toLowerCase().replace(/\s/g, '');
            const targetGrid = document.querySelector(`#cat-${temizID} .parts-grid`);

            if (targetGrid) {
                const resimYolu = (klasor && klasor !== "") ? `../img/YedekParca/${klasor}/${resimAdi}` : `../img/YedekParca/${resimAdi}`;
                targetGrid.innerHTML += `
                <div class="part-item">
                    <div class="part-img"><img src="${resimYolu}" alt="${isim}" onerror="this.src='../img/placeholder.jpg'"></div>
                    <div class="part-details">
                        <h3>${isim}</h3>
                        <p>Marka: ${marka}</p>
                        <span class="price">${fiyat}</span>
                        <button class="order-btn" onclick="window.open('https://wa.me/905376183344?text=${encodeURIComponent(isim)} için fiyat almak istiyorum', '_blank')">Fiyat Al</button>
                    </div>
                </div>`;
            }
        });
    } catch (e) { console.error(e); }
}
// MOBIL MENÜ TOGGLE
document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.querySelector('.mobile-toggle');
    const menu = document.querySelector('.nav-menu');

    if (toggle && menu) {
        toggle.onclick = function () {
            menu.classList.toggle('active');

            // İkonu değiştir (Üç çizgi -> Çarpı)
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        };

        // Menü dışına tıklandığında otomatik kapatma
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
                menu.classList.remove('active');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });
    }
});
        //BLOG SAYFASI İÇİN DETAYLARI GÖSTER/GİZLE
function toggleDetails(id, btn) {
    const details = document.getElementById(id);
    
    // Mevcut durumun tam tersini yap
    if (details.style.display === "block") {
        details.style.display = "none";
        btn.textContent = "Detayları Gör ↓";
    } else {
        details.style.display = "block";
        btn.textContent = "Kapat ↑";
    }
}
