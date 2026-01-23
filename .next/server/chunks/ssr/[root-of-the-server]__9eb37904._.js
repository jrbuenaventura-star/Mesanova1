module.exports=[193695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70864,a=>{a.n(a.i(233290))},102894,a=>{a.n(a.i(666188))},13718,a=>{a.n(a.i(685523))},118198,a=>{a.n(a.i(545518))},262212,a=>{a.n(a.i(866114))},67971,a=>{a.n(a.i(826435))},686722,a=>{"use strict";let b=(0,a.i(211857).registerClientReference)(function(){throw Error("Attempted to call AdvancedProductEditor() from the server but AdvancedProductEditor is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/admin/advanced-product-editor.tsx <module evaluation>","AdvancedProductEditor");a.s(["AdvancedProductEditor",0,b])},123467,a=>{"use strict";let b=(0,a.i(211857).registerClientReference)(function(){throw Error("Attempted to call AdvancedProductEditor() from the server but AdvancedProductEditor is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/admin/advanced-product-editor.tsx","AdvancedProductEditor");a.s(["AdvancedProductEditor",0,b])},361127,a=>{"use strict";a.i(686722);var b=a.i(123467);a.n(b)},918925,a=>{"use strict";var b=a.i(907997),c=a.i(800717),d=a.i(998310);a.i(570396);var e=a.i(673727),f=a.i(361127);async function g({params:a}){let{id:g}=await a,h=await (0,d.createClient)(),{data:{user:i}}=await h.auth.getUser();i||(0,e.redirect)("/auth/login");let{data:j}=await h.from("user_profiles").select("role").eq("id",i.id).single();j?.role!=="superadmin"&&(0,e.redirect)("/");let{data:k}=await h.from("products").select(`
      *,
      collection:collections(*),
      categories:product_categories(
        *,
        subcategory:subcategories(
          *,
          silo:silos(*)
        )
      ),
      product_types:product_product_types(
        *,
        product_type:product_types(*)
      ),
      media:product_media(*)
    `).eq("id",g).single();k||(0,e.redirect)("/admin/products");let[{data:l},{data:m}]=await Promise.all([h.from("silos").select("*").order("order_index"),h.from("collections").select("*").order("order_index")]);return(0,b.jsxs)("div",{className:"container max-w-7xl py-8",children:[(0,b.jsxs)("div",{className:"mb-6",children:[(0,b.jsx)("h1",{className:"text-3xl font-bold",children:"Edición Avanzada de Producto"}),(0,b.jsx)("p",{className:"text-muted-foreground",children:"Edita todos los detalles del producto"})]}),(0,b.jsx)(c.Suspense,{fallback:(0,b.jsx)("div",{children:"Cargando..."}),children:(0,b.jsx)(f.AdvancedProductEditor,{product:k,silos:l||[],collections:m||[]})})]})}a.s(["default",()=>g])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__9eb37904._.js.map