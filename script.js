const SUPABASE_URL = "https://ysufdooypagdusicjrfv.supabase.co";
const SUPABASE_KEY = "sb_publishable_gIRNdakUJshJhb3UGzu4sg_e0GLMcsO";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let products = [];

const productGrid = document.getElementById("productGrid");

// Load products from Supabase
async function loadProducts() {
    productGrid.innerHTML = "<p>Loading products...</p>";

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Supabase Error:", error);
        productGrid.innerHTML = "<p>Unable to load products. Please try again.</p>";
        return;
    }

    products = data.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image_url || "https://placehold.co/600x450/f1f8f2/16834a?text=Dealbox",
        description: item.description || "",
        type: item.product_type,
        link: item.affiliate_url || "",
        category: item.category || ""
    }));

    renderProducts(products);
}

function renderProducts(list) {
    productGrid.innerHTML = "";

    if (list.length === 0) {
        productGrid.innerHTML = "<p>No products available yet.</p>";
        return;
    }

    list.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name;

        const info = document.createElement("div");
        info.className = "product-info";

        const name = document.createElement("h3");
        name.textContent = product.name;

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

function searchProducts() {
    const query = document.getElementById("searchInput").value.toLowerCase();

    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );

    renderProducts(filtered);
}

function showAllProducts() {
    renderProducts(products);
}

function showProductDetails(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    const message =
        "Hi, I am interested in purchasing this product.\n" +
        "Product: " + product.name +
        "\nPrice: ₹" + product.price;

    const action = product.type === "own"
        ? "https://wa.me/919526684957?text=" + encodeURIComponent(message)
        : product.link;

    const details = document.createElement("div");
    details.style.cssText = `
        position:fixed; inset:0; background:#0009; z-index:999;
        display:flex; align-items:center; justify-content:center;
        padding:15px;
    `;

    const panel = document.createElement("div");
    panel.style.cssText = `
        background:white; padding:25px; border-radius:14px;
        width:100%; max-width:450px; max-height:90vh;
        overflow-y:auto; position:relative;
    `;

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;
    img.style.cssText = "width:100%;height:210px;object-fit:contain;";

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
        width:100%;padding:14px;background:#16834a;
        color:white;border:0;border-radius:7px;
        font-weight:bold;cursor:pointer;
    `;

    buy.onclick = () => {
        if (product.type === "own") {
            if (action.includes("XXXXXXXXXX")) {
                alert("WhatsApp number is not configured yet.");
                return;
            }
            window.open(action, "_blank");
        } else {
            if (!product.link) {
                alert("Affiliate link is not available.");
                return;
            }
            window.open(product.link, "_blank", "noopener,noreferrer");
        }
    };

    const close = document.createElement("button");
    close.textContent = "✕";
    close.style.cssText = `
        position:absolute;right:15px;top:15px;
        border:0;background:white;font-size:22px;cursor:pointer;
    `;
    close.onclick = () => details.remove();

    panel.append(close, img, title, price, description, buy);
    details.appendChild(panel);

    details.onclick = event => {
        if (event.target === details) details.remove();
    };

    document.body.appendChild(details);
}

function toggleMenu() {
    document.querySelector("nav").classList.toggle("active");
}

// Start website
loadProducts();