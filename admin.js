const SUPABASE_URL = "https://ysufdooypagdusicjrfv.supabase.co";
const SUPABASE_KEY = "sb_publishable_gIRNdakUJshJhb3UGzu4sg_e0GLMcsO";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const $ = id => document.getElementById(id);

// STATUS
function showStatus(message, isError = false) {
    $("status").textContent = message;
    $("status").style.color = isError ? "#c0392b" : "#16834a";
}

function showCategoryStatus(message, isError = false) {
    $("categoryStatus").textContent = message;
    $("categoryStatus").style.color = isError ? "#c0392b" : "#16834a";
}

// DASHBOARD
async function showDashboard() {
    $("loginSection").style.display = "none";
    $("dashboard").style.display = "block";

    await loadCategories();
    await loadAdminProducts();
}

function showLogin() {
    $("loginSection").style.display = "block";
    $("dashboard").style.display = "none";
}

// VERIFY ADMIN
async function verifyAdmin() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        showLogin();
        return;
    }

    const { data, error } = await supabaseClient
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error || !data) {
        await supabaseClient.auth.signOut();
        showLogin();
        alert("This account is not authorized as an admin.");
        return;
    }

    await showDashboard();
}

// LOGIN
$("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    const email = $("adminEmail").value.trim();
    const password = $("adminPassword").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert("Login failed: " + error.message);
        return;
    }

    await verifyAdmin();
});

// LOGOUT
$("logoutBtn").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    showLogin();
});

// CATEGORY MANAGEMENT
async function loadCategories() {
    const categoryList = $("adminCategoryList");
    const categorySelect = $("productCategory");

    categoryList.textContent = "Loading categories...";

    const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        categoryList.textContent =
            "Could not load categories: " + error.message;
        return;
    }

    categoryList.innerHTML = "";

    categorySelect.innerHTML =
        '<option value="">Select Category</option>';

    if (!data || data.length === 0) {
        categoryList.textContent = "No categories added yet.";
        return;
    }

    data.forEach(category => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);

        const row = document.createElement("div");
        row.className = "admin-product";

        const name = document.createElement("strong");
        name.textContent = category.name;

        const remove = document.createElement("button");
        remove.className = "admin-btn danger";
        remove.textContent = "Delete";
        remove.onclick = () => deleteCategory(category);

        row.append(name, remove);
        categoryList.appendChild(row);
    });
}

// ADD CATEGORY
$("categoryForm").addEventListener("submit", async event => {
    event.preventDefault();

    const name = $("newCategoryName").value.trim();

    if (!name) {
        showCategoryStatus("Please enter a category name.", true);
        return;
    }

    const { data: existing, error: checkError } = await supabaseClient
        .from("categories")
        .select("id")
        .ilike("name", name);

    if (checkError) {
        showCategoryStatus(checkError.message, true);
        return;
    }

    if (existing && existing.length > 0) {
        showCategoryStatus("This category already exists.", true);
        return;
    }

    const { error } = await supabaseClient
        .from("categories")
        .insert({ name });

    if (error) {
        showCategoryStatus(error.message, true);
        return;
    }

    $("newCategoryName").value = "";
    showCategoryStatus("Category added successfully!");

    await loadCategories();
});

// DELETE CATEGORY
async function deleteCategory(category) {
    const { data: products, error: checkError } = await supabaseClient
        .from("products")
        .select("id")
        .eq("category", category.name)
        .limit(1);

    if (checkError) {
        alert("Could not check products: " + checkError.message);
        return;
    }

    if (products && products.length > 0) {
        alert(
            "This category is being used by a product. " +
            "Change that product's category before deleting this category."
        );
        return;
    }

    if (!confirm(`Delete category "${category.name}"?`)) return;

    const { error } = await supabaseClient
        .from("categories")
        .delete()
        .eq("id", category.id);

    if (error) {
        alert("Category delete failed: " + error.message);
        return;
    }

    showCategoryStatus("Category deleted successfully!");
    await loadCategories();
}

// LOAD PRODUCTS
async function loadAdminProducts() {
    $("adminProductList").textContent = "Loading...";

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        $("adminProductList").textContent = error.message;
        return;
    }

    $("adminProductList").innerHTML = "";

    if (!data || data.length === 0) {
        $("adminProductList").textContent = "No products found.";
        return;
    }

    data.forEach(product => {
        const row = document.createElement("div");
        row.className = "admin-product";

        const info = document.createElement("div");
        info.style.display = "flex";
        info.style.alignItems = "center";
        info.style.gap = "12px";

        const img = document.createElement("img");
        img.src = product.image_url ||
            "https://placehold.co/100x100?text=Product";
        img.alt = product.image_alt || product.name;

        const details = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = product.name;

        const price = document.createElement("p");
        price.textContent = "₹" + product.price;

        details.append(name, price);
        info.append(img, details);

        const actions = document.createElement("div");
        actions.className = "admin-actions";

        const edit = document.createElement("button");
        edit.className = "admin-btn";
        edit.textContent = "Edit";
        edit.onclick = () => editProduct(product);

        const remove = document.createElement("button");
        remove.className = "admin-btn danger";
        remove.textContent = "Delete";
        remove.onclick = () => deleteProduct(product);

        actions.append(edit, remove);
        row.append(info, actions);

        $("adminProductList").append(row);
    });
}

// IMAGE UPLOAD
async function uploadImage(file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${Date.now()}-${safeName}`;

    const { error } = await supabaseClient.storage
        .from("product-images")
        .upload(filePath, file, {
            upsert: false
        });

    if (error) throw error;

    const { data } = supabaseClient.storage
        .from("product-images")
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// ADD / UPDATE PRODUCT
$("productForm").addEventListener("submit", async event => {
    event.preventDefault();

    const saveButton = $("saveBtn");
    saveButton.disabled = true;

    showStatus("Saving product...");

    try {
        const id = $("productId").value;
        const file = $("productImage").files[0];

        let imageUrl = $("imageNote").dataset.currentImage || "";

        if (file) {
            imageUrl = await uploadImage(file);
        }

        const product = {
            name: $("productName").value.trim(),
            price: Number($("productPrice").value),
            category: $("productCategory").value,
            description: $("productDescription").value.trim(),
            product_type: $("productType").value,
            affiliate_url: $("affiliateLink").value.trim() || null,
            image_url: imageUrl || null,
            is_active: true,

            // SEO FIELDS
            seo_title: $("seoTitle").value.trim() || null,
            seo_description: $("seoDescription").value.trim() || null,
            seo_keywords: $("seoKeywords").value.trim() || null,
            image_alt: $("imageAlt").value.trim() || null
        };

        if (!product.category) {
            throw new Error("Please select a category.");
        }

        if (product.product_type === "affiliate" &&
            !product.affiliate_url) {
            throw new Error("Please enter the affiliate link.");
        }

        let result;

        if (id) {
            result = await supabaseClient
                .from("products")
                .update(product)
                .eq("id", id);
        } else {
            result = await supabaseClient
                .from("products")
                .insert(product);
        }

        if (result.error) throw result.error;

        showStatus(id
            ? "Product updated successfully!"
            : "Product added successfully!"
        );

        resetForm();
        await loadAdminProducts();

    } catch (error) {
        showStatus(error.message, true);
    } finally {
        saveButton.disabled = false;
    }
});

// EDIT PRODUCT
function editProduct(product) {
    $("productId").value = product.id;
    $("productName").value = product.name;
    $("productPrice").value = product.price;
    $("productCategory").value = product.category || "";
    $("productDescription").value = product.description || "";
    $("productType").value = product.product_type;
    $("affiliateLink").value = product.affiliate_url || "";

    // LOAD SEO FIELDS
    $("seoTitle").value = product.seo_title || "";
    $("seoDescription").value = product.seo_description || "";
    $("seoKeywords").value = product.seo_keywords || "";
    $("imageAlt").value = product.image_alt || "";

    $("productImage").value = "";
    $("imageNote").dataset.currentImage = product.image_url || "";

    $("imageNote").textContent = product.image_url
        ? "Current image will be kept unless a new image is selected."
        : "No current image.";

    $("formTitle").textContent = "Edit Product";
    $("saveBtn").textContent = "Update Product";
    $("cancelEditBtn").style.display = "inline-block";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// RESET FORM
function resetForm() {
    $("productForm").reset();
    $("productId").value = "";
    $("imageNote").dataset.currentImage = "";
    $("imageNote").textContent = "Choose an image from your device.";

    $("formTitle").textContent = "Add New Product";
    $("saveBtn").textContent = "Add Product";
    $("cancelEditBtn").style.display = "none";
}

$("cancelEditBtn").addEventListener("click", resetForm);

// DELETE PRODUCT
async function deleteProduct(product) {
    if (!confirm(`Delete "${product.name}"?`)) return;

    const { error } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", product.id);

    if (error) {
        alert("Delete failed: " + error.message);
        return;
    }

    alert("Product deleted successfully.");
    await loadAdminProducts();
}

// AUTH STATE
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
        showLogin();
    }
});

// CHECK LOGIN
verifyAdmin();
