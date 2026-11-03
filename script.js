const SUPABASE_URL = "https://ysufdooypagdusicjrfv.supabase.co";
const SUPABASE_KEY = "sb_publishable_gIRNdakUJshJhb3UGzu4sg_e0GLMcsO";

const WHATSAPP_NUMBER = "919526684957";
const CONTACT_EMAIL = "shopmivqo@gmail.com";
const WEBSITE_URL = "https://mivqo.github.io/mivqo/";

if (!window.supabase) {
    throw new Error("Supabase library not loaded. Check index.html.");
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let products = [];
let selectedCategory = "all";

const productGrid = document.getElementById("productGrid");
const categoryFilters = document.getElementById("categoryFilters");


// LOAD PRODUCTS
async function loadProducts() {
    if (!productGrid) return;

    productGrid.innerHTML = "<p>Loading products...</p>";

    try {
        const { data, error } = await supabaseClient
            .from("products")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        products = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image_url ||
                "https://placehold.co/600x450/f1f8f2/16834a?text=MIVQO",
            description: item.description || "",
            type: item.product_type,
            link: item.affiliate_url || "",
            category: item.category || ""
        }));

        await loadCategories();
        renderProducts(getFilteredProducts());

    } catch (error) {
        console.error("Product Loading Error:", error);
        productGrid.innerHTML =
            "<p>Unable to load products. Please refresh and try again.</p>";
    }
}


// LOAD CATEGORIES
async function loadCategories() {
    if (!categoryFilters) return;

    categoryFilters.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.className = "category-btn active";
    allButton.textContent = "All Products";
    allButton.onclick = () => filterCategory("all");
    categoryFilters.appendChild(allButton);

    let categories = [];

    try {
        const { data, error } = await supabaseClient
            .from("categories")
            .select("name")
            .order("name");

        if (error) throw error;

        categories = (data || []).map(item => item.name);

    } catch (error) {
        console.warn("Category table unavailable. Using product categories.", error);

        categories = products
            .map(product => product.category)
            .filter(Boolean);
    }

    categories = [...new Set(categories)];

    categories.forEach(category => {
        const button = document.createElement("button");
        button.className = "category-btn";
        button.textContent = category;

        button.onclick = () => filterCategory(category);

        categoryFilters.appendChild(button);
    });
}


// CATEGORY FILTER
function filterCategory(category) {
    selectedCategory = category;

    document.querySelectorAll(".category-btn").forEach(button => {
        button.classList.toggle(
            "active",
            (category === "all" && button.textContent === "All Products") ||
            (category !== "all" && button.textContent === category)
        );
    });

    renderProducts(getFilteredProducts());
}


// GET FILTERED PRODUCTS
function getFilteredProducts() {
    const searchInput = document.getElementById("searchInput");
    const query = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    return products.filter(product => {
        const matchesSearch =
            (product.name || "").toLowerCase().includes(query) ||
            (product.category || "").toLowerCase().includes(query);

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });
}


// DISPLAY PRODUCTS
function renderProducts(list) {
    if (!productGrid) return;

    productGrid.innerHTML = "";

    if (!list || list.length === 0) {
        productGrid.innerHTML = "<p>No products found.</p>";
        return;
    }

    list.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.id = "product-" + product.id;

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name || "MIVQO Product";

        img.onerror = () => {
            img.src = "https://placehold.co/600x450/f1f8f2/16834a?text=MIVQO";
        };

        const info = document.createElement("div");
        info.className = "product-info";

        const name = document.createElement("h3");
        name.textContent = product.name || "Product";

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = "₹" + product.price;

        const button = document.createElement("button");
        button.textContent = "View Details";
        button.onclick = () => showProductDetails(product.id);

        info.append(name, price, button);
        card.append(img, info);

        productGrid.appendChild(card);
    });
}


// SEARCH PRODUCTS
function searchProducts() {
    renderProducts(getFilteredProducts());
}


// SHOW ALL PRODUCTS
function showAllProducts() {
    selectedCategory = "all";

    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    filterCategory("all");
}


// PRODUCT DETAILS
function showProductDetails(id) {
    const product = products.find(item => String(item.id) === String(id));

    if (!product) return;

    const details = document.createElement("div");

    details.style.cssText = `
        position:fixed;
        inset:0;
        background:#0009;
        z-index:999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:15px;
    `;

    const panel = document.createElement("div");

    panel.style.cssText = `
        background:white;
        padding:25px;
        border-radius:14px;
        width:100%;
        max-width:450px;
        max-height:90vh;
        overflow-y:auto;
        position:relative;
    `;

    const close = document.createElement("button");
    close.textContent = "✕";

    close.style.cssText = `
        position:absolute;
        right:15px;
        top:15px;
        border:0;
        background:white;
        font-size:22px;
        cursor:pointer;
    `;

    close.onclick = () => details.remove();

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;
    img.style.cssText =
        "width:100%;height:210px;object-fit:contain;";

    const title = document.createElement("h2");
    title.textContent = product.name;

    const price = document.createElement("h2");
    price.textContent = "₹" + product.price;
    price.style.color = "#16834a";

    const description = document.createElement("p");
    description.textContent = product.description;
    description.style.margin = "15px 0";

    const buy = document.createElement("button");
    buy.textContent = "Buy Now →";

    buy.style.cssText = `
        width:100%;
        padding:14px;
        background:#16834a;
        color:white;
        border:0;
        border-radius:7px;
        font-weight:bold;
        cursor:pointer;
    `;

    buy.onclick = () => {
        if (product.type === "own") {
            showCheckoutForm(product);
        } else {
            if (!product.link) {
                alert("Affiliate link is not available.");
                return;
            }

            window.open(product.link, "_blank", "noopener,noreferrer");
        }
    };

    panel.append(close, img, title, price, description, buy);
    details.appendChild(panel);

    details.onclick = event => {
        if (event.target === details) {
            details.remove();
        }
    };

    document.body.appendChild(details);
}


// CHECKOUT FORM
function showCheckoutForm(product) {
    const details = document.querySelector("body > div[style*='position: fixed']");

    if (!details) return;

    details.innerHTML = "";

    const panel = document.createElement("div");

    panel.style.cssText = `
        background:white;
        padding:25px;
        border-radius:14px;
        width:100%;
        max-width:450px;
        max-height:90vh;
        overflow-y:auto;
    `;

    const heading = document.createElement("h2");
    heading.textContent = "Complete Your Order";
    heading.style.marginBottom = "8px";

    const productName = document.createElement("p");
    productName.textContent = product.name + " - ₹" + product.price;
    productName.style.cssText = "color:#16834a;font-weight:700;margin-bottom:20px;";

    const form = document.createElement("form");

    function createInput(labelText, placeholder, name, type = "text") {
        const wrapper = document.createElement("div");
        wrapper.style.marginBottom = "14px";

        const label = document.createElement("label");
        label.textContent = labelText;
        label.style.cssText = "display:block;font-size:13px;font-weight:600;margin-bottom:6px;";

        const input = document.createElement("input");
        input.type = type;
        input.name = name;
        input.placeholder = placeholder;
        input.required = true;

        if (name === "mobile") {
            input.type = "tel";
            input.pattern = "[0-9]{10}";
            input.maxLength = 10;
            input.minLength = 10;
        }

        if (name === "pincode") {
            input.type = "text";
            input.pattern = "[0-9]{6}";
            input.maxLength = 6;
            input.minLength = 6;
        }

        input.style.cssText = `
            width:100%;
            padding:12px;
            border:1px solid #ddd;
            border-radius:7px;
            font-size:14px;
            outline:none;
        `;

        wrapper.append(label, input);
        form.appendChild(wrapper);

        return input;
    }

    createInput("Full Name", "Enter your full name", "customerName");
    createInput("Mobile Number", "10 digit mobile number", "mobile");
    createInput("Full Address", "House name, street, place, district", "address");
    createInput("Pincode", "6 digit pincode", "pincode");

    const paymentWrapper = document.createElement("div");
    paymentWrapper.style.marginBottom = "20px";

    const paymentLabel = document.createElement("label");
    paymentLabel.textContent = "Payment Method";
    paymentLabel.style.cssText = "display:block;font-size:13px;font-weight:600;margin-bottom:10px;";

    const paymentSelect = document.createElement("select");
    paymentSelect.name = "payment";
    paymentSelect.required = true;

    paymentSelect.style.cssText = `
        width:100%;
        padding:12px;
        border:1px solid #ddd;
        border-radius:7px;
        font-size:14px;
        background:white;
    `;

    [
        { value: "GPay / Online Payment", text: "Online Payment (GPay)" },
        { value: "Cash on Delivery", text: "Cash on Delivery (COD)" }
    ].forEach(item => {
        const option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.text;
        paymentSelect.appendChild(option);
    });

    paymentWrapper.append(paymentLabel, paymentSelect);
    form.appendChild(paymentWrapper);

    const note = document.createElement("p");
    note.textContent = "For GPay orders, payment will be verified manually before confirmation.";
    note.style.cssText = "font-size:12px;color:#777;margin-bottom:15px;line-height:1.5;";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Submit Order via WhatsApp";

    submit.style.cssText = `
        width:100%;
        padding:14px;
        background:#16834a;
        color:white;
        border:0;
        border-radius:7px;
        font-weight:700;
        cursor:pointer;
    `;

    const back = document.createElement("button");
    back.type = "button";
    back.textContent = "Cancel";

    back.style.cssText = `
        width:100%;
        padding:12px;
        margin-top:10px;
        background:#f1f1f1;
        color:#333;
        border:0;
        border-radius:7px;
        cursor:pointer;
    `;

    back.onclick = () => details.remove();

    form.append(note, submit, back);

    form.onsubmit = event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const customerName = form.elements.customerName.value.trim();
        const mobile = form.elements.mobile.value.trim();
        const address = form.elements.address.value.trim();
        const pincode = form.elements.pincode.value.trim();
        const payment = paymentSelect.value;

        const productPage =
            WEBSITE_URL + "#product-" + encodeURIComponent(product.id);

        const message =
            "🛍️ *NEW ORDER - MIVQO*\n\n" +
            "*Product:* " + product.name + "\n" +
            "*Price:* ₹" + product.price + "\n" +
            "*Product Image:* " + product.image + "\n" +
            "*Product Link:* " + productPage + "\n\n" +
            "*CUSTOMER DETAILS*\n" +
            "*Name:* " + customerName + "\n" +
            "*Mobile:* " + mobile + "\n" +
            "*Address:* " + address + "\n" +
            "*Pincode:* " + pincode + "\n\n" +
            "*Payment Method:* " + payment + "\n\n" +
            "Please confirm this order.";

        const whatsappURL =
            "https://wa.me/" + WHATSAPP_NUMBER +
            "?text=" + encodeURIComponent(message);

        window.open(whatsappURL, "_blank", "noopener,noreferrer");
        details.remove();
    };

    panel.append(heading, productName, form);
    details.appendChild(panel);
}


// MOBILE NAVIGATION
function toggleMenu() {
    const nav = document.querySelector("nav");

    if (nav) {
        nav.classList.toggle("active");
    }
}


// START WEBSITE
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProducts);
} else {
    loadProducts();
}