import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    ar: {
        translation: {
            "dashboard": {
                "overview": "نظرة عامة",
                "inventory": "المخزون",
                "sales": "المبيعات",
                "suppliers": "الموردون",
                "orders": "الطلبيات",
                "customers": "العملاء",
                "reports": "التقارير",
                "audit": "سجل العمليات",
                "searchInventory": "البحث في المخزون...",
                "searchSale": "البحث عن منتج للبيع...",
                "addToCart": "إضافة للسلة",
                "cartTitle": "سلة البيع",
                "emptyCart": "السلة فارغة",
                "saleSuccess": "تم تسجيل البيع بنجاح!",
                "confirmSale": "تأكيد عملية البيع",
                "transactions": "عملية",
                "product": "المنتج",
                "costPrice": "سعر التكلفة",
                "sellingPrice": "سعر البيع",
                "profit": "الربح",
                "expiry": "الصلاحية",
                "stats": {
                    "total_sales": "إجمالي المبيعات",
                    "net_profit": "صافي الربح",
                    "stock_alerts": "تنبيهات المخزون"
                },
                "charts": {
                    "sales_trend": "تحليل المبيعات والأرباح",
                    "top_products": "أكثر المنتجات مبيعاً"
                }
            },
            "common": {
                "add": "إضافة",
                "edit": "تعديل",
                "delete": "حذف",
                "save": "حفظ",
                "cancel": "إلغاء",
                "loading": "جاري التحميل...",
                "currency": "د.م",
                "quantity": "الكمية",
                "date": "التاريخ",
                "total": "المجموع",
                "actions": "إجراءات",
                "confirmDelete": "هل أنت متأكد من الحذف؟",
                "processing": "جاري المعالجة...",
                "managerAccess": "دخول المدير",
                "enterPin": "الرجاء إدخال رمز التحقق المكون من 4 أرقام",
                "invalidPin": "رمز التحقق غير صحيح!",
                "confirm": "تأكيد",
                "manager": "المدير",
                "lockManager": "قفل وصول المدير",
                "profit": "الربح",
                "noData": "لا توجد بيانات",
                "noSales": "لا توجد مبيعات بعد"
            }
        }
    },
    fr: {
        translation: {
            "dashboard": {
                "overview": "Aperçu",
                "inventory": "Stock",
                "sales": "Ventes",
                "suppliers": "Fournisseurs",
                "orders": "Commandes",
                "customers": "Clients",
                "reports": "Rapports",
                "audit": "Audit",
                "searchInventory": "Chercher dans le stock...",
                "searchSale": "Chercher un produit à vendre...",
                "addToCart": "Ajouter au panier",
                "cartTitle": "Panier",
                "emptyCart": "Le panier est vide",
                "saleSuccess": "Vente enregistrée !",
                "confirmSale": "Confirmer la vente",
                "transactions": "transactions",
                "product": "Produit",
                "costPrice": "Prix d'achat",
                "sellingPrice": "Prix de vente",
                "profit": "Profit",
                "expiry": "Expiration",
                "stats": {
                    "total_sales": "Ventes Totales",
                    "net_profit": "Bénéfice Net",
                    "stock_alerts": "Alertes Stock"
                },
                "charts": {
                    "sales_trend": "Analyse des Ventes",
                    "top_products": "Top Produits"
                }
            },
            "common": {
                "add": "Ajouter",
                "edit": "Modifier",
                "delete": "Supprimer",
                "save": "Enregistrer",
                "cancel": "Annuler",
                "loading": "Chargement...",
                "currency": "MAD",
                "quantity": "Quantité",
                "date": "Date",
                "total": "Total",
                "actions": "Actions",
                "confirmDelete": "Confirmer la suppression ?",
                "processing": "Traitement...",
                "managerAccess": "Accès Administrateur",
                "enterPin": "Veuillez entrer le code PIN à 4 chiffres",
                "invalidPin": "Code PIN invalide !",
                "confirm": "Confirmer",
                "manager": "Directeur",
                "lockManager": "Verrouiller l'accès",
                "profit": "Profit",
                "noData": "Aucune donnée",
                "noSales": "Aucune vente"
            }
        }
    },
    en: {
        translation: {
            "dashboard": {
                "overview": "Overview",
                "inventory": "Inventory",
                "sales": "Sales",
                "suppliers": "Suppliers",
                "orders": "Orders",
                "customers": "Customers",
                "reports": "Reports",
                "audit": "Audit Logs",
                "searchInventory": "Search inventory...",
                "searchSale": "Search product to sell...",
                "addToCart": "Add to Cart",
                "cartTitle": "Cart",
                "emptyCart": "Cart is empty",
                "saleSuccess": "Sale completed!",
                "confirmSale": "Confirm Sale",
                "transactions": "transactions",
                "product": "Product",
                "costPrice": "Cost Price",
                "sellingPrice": "Selling Price",
                "profit": "Profit",
                "expiry": "Expiry",
                "stats": {
                    "total_sales": "Total Sales",
                    "net_profit": "Net Profit",
                    "stock_alerts": "Stock Alerts"
                },
                "charts": {
                    "sales_trend": "Sales & Profit",
                    "top_products": "Top Products"
                }
            },
            "common": {
                "add": "Add",
                "edit": "Edit",
                "delete": "Delete",
                "save": "Save",
                "cancel": "Cancel",
                "loading": "Loading...",
                "currency": "MAD",
                "quantity": "Quantity",
                "date": "Date",
                "total": "Total",
                "actions": "Actions",
                "confirmDelete": "Are you sure you want to delete?",
                "processing": "Processing...",
                "managerAccess": "Manager Access",
                "enterPin": "Please enter the 4-digit PIN",
                "invalidPin": "Invalid PIN!",
                "confirm": "Confirm",
                "manager": "Manager",
                "lockManager": "Lock Manager Access",
                "profit": "Profit",
                "noData": "No data",
                "noSales": "No sales yet"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'ar',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
