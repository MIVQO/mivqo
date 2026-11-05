
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
    await loadVisitorAnalytics();
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


// ===================================
// MIVQO VISITOR ANALYTICS
// ===================================

// FETCH ALL VISITOR RECORDS
async function getAllVisitorRecords() {
    const allRecords = [];
    const pageSize = 1000;
    let from = 0;

    while (true) {
        const { data, error } = await supabaseClient
            .from("site_visits")
            .select("id, visitor_id, page_path, product_id, visited_at")
            .order("visited_at", { ascending: false })
            .range(from, from + pageSize - 1);

        if (error) throw error;

        allRecords.push(...(data || []));

        if (!data || data.length < pageSize) break;

        from += pageSize;
    }

    return allRecords;
}

// LOCAL DATE BOUNDARIES
function getLocalDayRange(date = new Date()) {
    const start = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const end = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
    );

    return {
        start: start.getTime(),
        end: end.getTime()
    };
}

function safeText(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// LOAD VISITOR DASHBOARD
async function loadVisitorAnalytics() {
    const report = $("visitorReport");
    const productViews = $("productViews");

    report.textContent = "Loading visitor reports...";
    productViews.textContent = "Loading product views...";

    try {
        const visits = await getAllVisitorRecords();

        const uniqueIds = new Set(
            visits.map(v => v.visitor_id).filter(Boolean)
        );

        const todayRange = getLocalDayRange();

        const todayRecords = visits.filter(v => {
            const time = new Date(v.visited_at).getTime();
            return time >= todayRange.start && time < todayRange.end;
        });

        const todayUnique = new Set(
            todayRecords.map(v => v.visitor_id).filter(Boolean)
        );

        $("totalVisits").textContent = visits.length.toLocaleString();
        $("uniqueVisitors").textContent = uniqueIds.size.toLocaleString();
        $("todayVisitors").textContent = todayUnique.size.toLocaleString();
        $("todayVisits").textContent = todayRecords.length.toLocaleString();

        await loadVisitorReport(visits);
        await loadProductViews(visits);

    } catch (error) {
        report.textContent = "Could not load visitor data: " + error.message;
        productViews.textContent = "Could not load product views.";
        console.error("Visitor analytics error:", error);
    }
}

// MONTHLY + DAILY VISITOR REPORT
async function loadVisitorReport(existingVisits = null) {
    const report = $("visitorReport");
    report.textContent = "Loading reports...";

    try {
        const visits = existingVisits || await getAllVisitorRecords();

        const startValue = $("visitorStartDate").value;
        const endValue = $("visitorEndDate").value;

        let filtered = visits;

        if (startValue) {
            const start = new Date(startValue + "T00:00:00").getTime();

            filtered = filtered.filter(v =>
                new Date(v.visited_at).getTime() >= start
            );
        }

        if (endValue) {
            const end = new Date(endValue + "T00:00:00");
            end.setDate(end.getDate() + 1);

            filtered = filtered.filter(v =>
                new Date(v.visited_at).getTime() < end.getTime()
            );
        }

        const daily = {};
        const monthly = {};

        filtered.forEach(v => {
            const date = new Date(v.visited_at);

            const dayKey = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0")
            ].join("-");

            const monthKey = dayKey.substring(0, 7);

            if (!daily[dayKey]) {
                daily[dayKey] = {
                    visits: 0,
                    visitors: new Set()
                };
            }

            if (!monthly[monthKey]) {
                monthly[monthKey] = {
                    visits: 0,
                    visitors: new Set()
                };
            }

            daily[dayKey].visits++;
            monthly[monthKey].visits++;

            if (v.visitor_id) {
                daily[dayKey].visitors.add(v.visitor_id);
                monthly[monthKey].visitors.add(v.visitor_id);
            }
        });

        const dailyRows = Object.keys(daily).sort().reverse();
        const monthlyRows = Object.keys(monthly).sort().reverse();

        if (dailyRows.length === 0) {
            report.textContent = "No visitor records found for this period.";
            return;
        }

        let html = `
            <h3>Monthly Visitor Report</h3>
            <div class="visitor-table-wrap">
            <table class="visitor-report-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Total Visits</th>
                        <th>Unique Visitors</th>
                    </tr>
                </thead>
                <tbody>
        `;

        monthlyRows.forEach(key => {
            const [year, month] = key.split("-");

            const monthName = new Date(
                Number(year),
                Number(month) - 1
            ).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric"
            });

            html += `
                <tr>
                    <td>${safeText(monthName)}</td>
                    <td>${monthly[key].visits.toLocaleString()}</td>
                    <td>${monthly[key].visitors.size.toLocaleString()}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            </div>

            <h3 style="margin-top:25px;">Daily Visitor Report</h3>
            <div class="visitor-table-wrap">
            <table class="visitor-report-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Total Visits</th>
                        <th>Unique Visitors</th>
                    </tr>
                </thead>
                <tbody>
        `;

        dailyRows.forEach(key => {
            html += `
                <tr>
                    <td>${safeText(key)}</td>
                    <td>${daily[key].visits.toLocaleString()}</td>
                    <td>${daily[key].visitors.size.toLocaleString()}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            </div>
        `;

        report.innerHTML = html;

    } catch (error) {
        report.textContent = "Report error: " + error.message;
    }
}

// PRODUCT-WISE VIEWS
async function loadProductViews(visits) {
    const container = $("productViews");

    const counts = {};

    visits.forEach(v => {
        if (v.product_id) {
            counts[v.product_id] = (counts[v.product_id] || 0) + 1;
        }
    });

    const productIds = Object.keys(counts);

    if (productIds.length === 0) {
        container.textContent = "No product views recorded yet.";
        return;
    }

    const { data: products, error } = await supabaseClient
        .from("products")
        .select("id, name")
        .in("id", productIds);

    if (error) {
        container.textContent =
            "Could not load product names: " + error.message;
        return;
    }

    const names = {};

    (products || []).forEach(p => {
        names[p.id] = p.name;
    });

    const sorted = productIds.sort((a, b) => counts[b] - counts[a]);

    let html = `
        <div class="visitor-table-wrap">
        <table class="visitor-report-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Total Views</th>
                </tr>
            </thead>
            <tbody>
    `;

    sorted.forEach(id => {
        html += `
            <tr>
                <td>${safeText(names[id] || "Deleted / unavailable product")}</td>
                <td>${counts[id].toLocaleString()}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        </div>
    `;

    container.innerHTML = html;
}

// APPLY CUSTOM DATE FILTER
$("filterVisitorsBtn").addEventListener("click", async () => {
    const start = $("visitorStartDate").value;
    const end = $("visitorEndDate").value;

    if (start && end && start > end) {
        alert("From Date cannot be later than To Date.");
        return;
    }

    await loadVisitorReport();
});

// ALL DATES
$("allVisitorsBtn").addEventListener("click", async () => {
    $("visitorStartDate").value = "";
    $("visitorEndDate").value = "";

    await loadVisitorReport();
});

// AUTH STATE
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
        showLogin();
    }
});

// CHECK LOGIN
verifyAdmin();
