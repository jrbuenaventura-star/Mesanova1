module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70864,a=>{a.n(a.i(33290))},2894,a=>{a.n(a.i(66188))},13718,a=>{a.n(a.i(85523))},18198,a=>{a.n(a.i(45518))},62212,a=>{a.n(a.i(66114))},67971,a=>{a.n(a.i(26435))},86722,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call AdvancedProductEditor() from the server but AdvancedProductEditor is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/admin/advanced-product-editor.tsx <module evaluation>","AdvancedProductEditor");a.s(["AdvancedProductEditor",0,b])},23467,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call AdvancedProductEditor() from the server but AdvancedProductEditor is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/admin/advanced-product-editor.tsx","AdvancedProductEditor");a.s(["AdvancedProductEditor",0,b])},61127,a=>{"use strict";a.i(86722);var b=a.i(23467);a.n(b)},18925,a=>{"use strict";var b=a.i(7997),c=a.i(717),d=a.i(98310);a.i(70396);var e=a.i(73727),f=a.i(61127);async function g({params:a}){let{id:g}=await a,h=await (0,d.createClient)(),{data:{user:i}}=await h.auth.getUser();i||(0,e.redirect)("/auth/login");let{data:j}=await h.from("user_profiles").select("role").eq("id",i.id).single();j?.role!=="superadmin"&&(0,e.redirect)("/");let{data:k}=await h.from("products").select(`
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