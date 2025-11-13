// === Konfigurasi Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB35RYpFoHPFOFbQhr6rtbAWiWdGbta0I4",
  authDomain: "kuis-hamami.firebaseapp.com",
  databaseURL: "https://kuis-hamami-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kuis-hamami",
  storageBucket: "kuis-hamami.firebasestorage.app",
  messagingSenderId: "955115071133",
  appId: "1:955115071133:web:c42d2f365082c74bf39674"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// === Variabel global keranjang ===
let cart = [];

// === Pilih elemen DOM ===
const cartIcon = document.getElementById("cart-icon");
const cartModal = document.getElementById("cart-modal");
const closeCart = document.getElementById("close-cart");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const totalPriceEl = document.getElementById("total-price");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutForm = document.getElementById("checkout-form");

// === Tampilkan / sembunyikan keranjang ===
cartIcon.addEventListener("click", () => {
  cartModal.classList.add("show");
});

closeCart.addEventListener("click", () => {
  cartModal.classList.remove("show");
});

// === Tambah produk ke keranjang ===
document.querySelectorAll(".beli").forEach((btn) => {
  btn.addEventListener("click", () => {
    const product = btn.closest(".product");
    const name = product.querySelector("h3").textContent;
    const priceText = product.querySelector(".price").textContent.replace(/[^\d]/g, "");
    const price = parseInt(priceText);
    
    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price, qty: 1 });
    }

    updateCart();
  });
});

// === Update tampilan keranjang ===
function updateCart() {
  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.qty;

    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <span>${item.name}</span>
      <div class="qty">
        <button onclick="changeQty(${index}, -1)">-</button>
        <span>${item.qty}</span>
        <button onclick="changeQty(${index}, 1)">+</button>
      </div>
      <span>Rp ${item.price * item.qty}</span>
      <button class="remove" onclick="removeItem(${index})">x</button>
    `;
    cartItems.appendChild(div);
  });

  totalPriceEl.textContent = `Rp ${total.toLocaleString("id-ID")}`;
  cartCount.textContent = cart.length;
}

// === Ubah jumlah barang ===
window.changeQty = function(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  updateCart();
};

// === Hapus barang ===
window.removeItem = function(index) {
  cart.splice(index, 1);
  updateCart();
};

// === Proses Checkout ===
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Keranjang masih kosong!");
    return;
  }
  checkoutForm.style.display = "block";
});

// === Kirim data ke Firebase ===
checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama").value.trim();
  const alamat = document.getElementById("alamat").value.trim();
  const metode = document.getElementById("metode").value;

  if (!nama || !alamat || !metode) {
    alert("Lengkapi semua data checkout!");
    return;
  }

  const transaksiData = {
    nama,
    alamat,
    metode,
    cart,
    total: cart.reduce((sum, i) => sum + i.price * i.qty, 0),
    waktu: new Date().toISOString()
  };

  try {
    // Simpan ke Firestore
    await addDoc(collection(db, "transaksi"), transaksiData);

    // Simpan ringkasan ke Realtime Database
    await push(ref(rtdb, "transaksi_ringkas"), {
      nama,
      total: transaksiData.total,
      waktu: transaksiData.waktu
    });

    alert("Transaksi berhasil disimpan!");
    cart = [];
    updateCart();
    checkoutForm.reset();
    checkoutForm.style.display = "none";
    cartModal.classList.remove("show");
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan transaksi: " + err.message);
  }
});
