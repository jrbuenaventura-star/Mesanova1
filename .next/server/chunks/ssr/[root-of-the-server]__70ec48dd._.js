module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70864,a=>{a.n(a.i(33290))},2894,a=>{a.n(a.i(66188))},13718,a=>{a.n(a.i(85523))},18198,a=>{a.n(a.i(45518))},62212,a=>{a.n(a.i(66114))},40088,a=>{"use strict";var b=a.i(7997),c=a.i(89246),d=a.i(96942),e=a.i(82248);let f=(0,d.cva)("inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",secondary:"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",destructive:"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",outline:"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"}},defaultVariants:{variant:"default"}});function g({className:a,variant:d,asChild:g=!1,...h}){let i=g?c.Slot:"span";return(0,b.jsx)(i,{"data-slot":"badge",className:(0,e.cn)(f({variant:d}),a),...h})}a.s(["Badge",()=>g])},67713,a=>{"use strict";var b=a.i(98310);async function c(){let a=await (0,b.createClient)(),{data:c,error:d}=await a.from("silos").select(`
      *,
      subcategories (*)
    `).order("order_index");if(d)throw d;return c}async function d(a){let c=await (0,b.createClient)(),{data:d,error:e}=await c.from("products").select(`
      *,
      collection:collections(*),
      product_categories (
        *,
        subcategory:subcategories (
          *,
          silo:silos (*)
        )
      ),
      product_types:product_product_types (
        *,
        product_type:product_types (*)
      ),
      product_media (*),
      product_similar (
        similar_product:products (*)
      ),
      product_complement (
        complement_product:products (*)
      ),
      warehouse_stock:product_warehouse_stock (
        *,
        warehouse:warehouses (*)
      )
    `).eq("slug",a).eq("is_active",!0).single();return e?(console.log("[v0] Error fetching product:",e),null):d}async function e(a,c=20){let d=await (0,b.createClient)(),{data:f,error:g}=await d.from("products").select(`
      *,
      product_categories!inner (
        subcategory:subcategories!inner (
          slug
        )
      )
    `).eq("product_categories.subcategory.slug",a).eq("is_active",!0).order("pdt_descripcion").limit(c);return g?[]:f||[]}async function f(a){let c=await (0,b.createClient)(),{error:d}=await c.from("product_types").select("id").limit(1);if(d)return console.log("[v0] product_types table doesn't exist yet, returning empty array"),[];try{let{data:b,error:d}=await c.from("product_types").select(`
        *,
        subcategory:subcategories!inner (
          slug
        ),
        product_product_types!inner (
          product:products!inner (
            is_active
          )
        )
      `).eq("subcategory.slug",a).eq("product_product_types.product.is_active",!0).order("order_index");if(d)return console.log("[v0] Error fetching product types:",d),[];return b||[]}catch(a){return console.log("[v0] Exception fetching product types:",a),[]}}async function g(a,c){let d=await (0,b.createClient)(),{error:f}=await d.from("product_types").select("id").limit(1);if(f)return console.log("[v0] product_types table doesn't exist yet, falling back to subcategory only"),e(a);try{let{data:b,error:e}=await d.from("products").select(`
        *,
        product_categories!inner (
          subcategory:subcategories!inner (
            slug
          )
        ),
        product_product_types!inner (
          product_type:product_types!inner (
            slug
          )
        )
      `).eq("product_categories.subcategory.slug",a).eq("product_product_types.product_type.slug",c).eq("is_active",!0).order("pdt_descripcion");if(e){let{data:b,error:c}=await d.from("products").select(`
          *,
          product_categories!inner (
            subcategory:subcategories!inner (
              slug
            )
          )
        `).eq("product_categories.subcategory.slug",a).eq("is_active",!0).order("pdt_descripcion");if(c)return[];return b||[]}return b||[]}catch(b){return console.log("[v0] Exception in getProductsBySubcategoryAndType:",b),e(a)}}async function h(a,c=20){let d=await (0,b.createClient)(),{data:e,error:f}=await d.from("products").select("*").eq("is_active",!0).or(`pdt_descripcion.ilike.%${a}%,nombre_comercial.ilike.%${a}%,pdt_codigo.ilike.%${a}%`).limit(c);if(f)throw f;return e}async function i(a=10,c=0){let d=await (0,b.createClient)(),{data:e,error:f}=await d.from("blog_posts").select(`
      *,
      author:user_profiles (*),
      blog_post_categories (
        category:blog_categories (*)
      )
    `).eq("status","published").order("published_at",{ascending:!1}).range(c,c+a-1);if(f)throw f;return e}async function j(a){let c=await (0,b.createClient)();console.log("[v0] Searching for blog post with slug:",a);let{data:d,error:e}=await c.from("blog_posts").select("*").eq("slug",a).eq("status","published").single();if(console.log("[v0] Blog post query result:",{found:!!d,error:e?.message}),e)return console.error("[v0] Error fetching blog post:",e),null;if(!d)return console.log("[v0] No post found with slug:",a),null;let f=null;if(d.author_id){let{data:a}=await c.from("user_profiles").select("id, full_name, avatar_url").eq("id",d.author_id).single();f=a}let{data:g}=await c.from("blog_post_categories").select(`
      category:blog_categories (
        id,
        name,
        slug
      )
    `).eq("post_id",d.id);return c.from("blog_posts").update({views_count:(d.views_count||0)+1}).eq("id",d.id).then(()=>{}),{...d,author:f,blog_post_categories:g||[]}}async function k(a,c=10){let d=await (0,b.createClient)(),{data:e,error:f}=await d.from("blog_posts").select(`
      *,
      author:user_profiles (*),
      blog_post_categories!inner (
        category:blog_categories!inner (slug)
      )
    `).eq("blog_post_categories.blog_categories.slug",a).eq("status","published").order("published_at",{ascending:!1}).limit(c);if(f)throw f;return e}async function l(){let a=await (0,b.createClient)(),{data:c,error:d}=await a.from("blog_categories").select(`
      *,
      blog_post_categories (count)
    `).order("name");if(d)throw d;return c}async function m(a,c=3){let d=await (0,b.createClient)(),{data:e}=await d.from("blog_post_categories").select("category_id").eq("post_id",a);if(!e||0===e.length){let{data:b,error:e}=await d.from("blog_posts").select("id, slug, title, excerpt, featured_image_url, published_at").eq("status","published").neq("id",a).order("published_at",{ascending:!1}).limit(c);return b||[]}let f=e.map(a=>a.category_id),{data:g}=await d.from("blog_post_categories").select("post_id").in("category_id",f).neq("post_id",a);if(!g||0===g.length)return[];let h=[...new Set(g.map(a=>a.post_id))],{data:i,error:j}=await d.from("blog_posts").select("id, slug, title, excerpt, featured_image_url, published_at").eq("status","published").in("id",h).order("published_at",{ascending:!1}).limit(c);return i||[]}a.s(["getAvailableProductTypesBySubcategory",()=>f,"getBlogCategories",()=>l,"getBlogPostBySlug",()=>j,"getBlogPosts",()=>i,"getBlogPostsByCategory",()=>k,"getProductBySlug",()=>d,"getProductsBySubcategoryAndType",()=>g,"getRelatedBlogPosts",()=>m,"getSilosWithSubcategories",()=>c,"searchProducts",()=>h])},99616,a=>{"use strict";let b=(0,a.i(1269).default)("ShoppingCart",[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]]);a.s(["ShoppingCart",()=>b],99616)},77829,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call FavoriteButton() from the server but FavoriteButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/products/favorite-button.tsx <module evaluation>","FavoriteButton");a.s(["FavoriteButton",0,b])},43853,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call FavoriteButton() from the server but FavoriteButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/products/favorite-button.tsx","FavoriteButton");a.s(["FavoriteButton",0,b])},14765,a=>{"use strict";a.i(77829);var b=a.i(43853);a.n(b)},8540,a=>{"use strict";var b=a.i(7997),c=a.i(3236),d=a.i(95936),e=a.i(29171),f=a.i(40088),g=a.i(43917),h=a.i(99616),i=a.i(14765);function j({product:a,showFavoriteButton:j=!0,isFavorited:k=!1}){let l=a.upp_existencia>0;return(0,b.jsxs)(e.Card,{className:"group overflow-hidden h-full flex flex-col",children:[(0,b.jsxs)("div",{className:"relative",children:[(0,b.jsx)(d.default,{href:`/productos/${a.slug}`,className:"block",children:(0,b.jsxs)("div",{className:"relative aspect-square overflow-hidden bg-muted",children:[(0,b.jsx)(c.default,{src:a.imagen_principal_url||"/placeholder.svg?height=300&width=300",alt:a.nombre_comercial||a.pdt_descripcion,fill:!0,className:"object-cover group-hover:scale-105 transition-transform duration-300",sizes:"(max-width: 768px) 50vw, 25vw"}),(0,b.jsxs)("div",{className:"absolute top-2 left-2 flex flex-col gap-1",children:[a.is_new&&(0,b.jsx)(f.Badge,{variant:"default",className:"w-fit",children:"Nuevo"}),a.is_on_sale&&(0,b.jsx)(f.Badge,{variant:"destructive",className:"w-fit",children:"Oferta"}),!l&&(0,b.jsx)(f.Badge,{variant:"secondary",className:"w-fit",children:"Agotado"})]})]})}),j&&(0,b.jsx)("div",{className:"absolute top-2 right-2 z-10",children:(0,b.jsx)(i.FavoriteButton,{productId:a.id,initialIsFavorite:k,className:"bg-background/80 backdrop-blur-sm hover:bg-background"})})]}),(0,b.jsxs)(e.CardContent,{className:"p-4 flex-1",children:[(0,b.jsx)(d.default,{href:`/productos/${a.slug}`,children:(0,b.jsx)("h3",{className:"font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors",children:a.nombre_comercial||a.pdt_descripcion})}),(0,b.jsxs)("p",{className:"text-xs text-muted-foreground mb-2",children:["Código: ",a.pdt_codigo]}),(0,b.jsxs)("div",{className:"flex items-baseline gap-2",children:[(0,b.jsxs)("span",{className:"text-lg font-bold",children:["$",a.precio?.toFixed(2)]}),a.is_on_sale&&(0,b.jsxs)("span",{className:"text-sm text-muted-foreground line-through",children:["$",(1.2*a.precio).toFixed(2)]})]})]}),(0,b.jsx)(e.CardFooter,{className:"p-4 pt-0",children:(0,b.jsxs)(g.Button,{className:"w-full",size:"sm",disabled:!l,children:[(0,b.jsx)(h.ShoppingCart,{className:"h-4 w-4 mr-2"}),l?"Agregar":"Agotado"]})})]})}a.s(["ProductCard",()=>j])},6911,a=>{"use strict";var b=a.i(7997),c=a.i(717),d=a.i(67713),e=a.i(8540),f=a.i(40905),g=a.i(95936),h=a.i(43917);async function i({query:a}){if(!a||0===a.trim().length)return(0,b.jsxs)("div",{className:"text-center py-12",children:[(0,b.jsx)(f.Search,{className:"h-12 w-12 mx-auto text-muted-foreground mb-4"}),(0,b.jsx)("h2",{className:"text-xl font-semibold mb-2",children:"Ingresa un término de búsqueda"}),(0,b.jsx)("p",{className:"text-muted-foreground",children:"Usa la barra de búsqueda para encontrar productos"})]});let c=await (0,d.searchProducts)(a,50);return c&&0!==c.length?(0,b.jsxs)("div",{children:[(0,b.jsxs)("p",{className:"text-muted-foreground mb-6",children:["Se encontraron ",c.length," producto",1!==c.length?"s":"",' para "',a,'"']}),(0,b.jsx)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",children:c.map(a=>(0,b.jsx)(e.ProductCard,{product:a},a.id))})]}):(0,b.jsxs)("div",{className:"text-center py-12",children:[(0,b.jsx)(f.Search,{className:"h-12 w-12 mx-auto text-muted-foreground mb-4"}),(0,b.jsx)("h2",{className:"text-xl font-semibold mb-2",children:"No se encontraron resultados"}),(0,b.jsxs)("p",{className:"text-muted-foreground mb-6",children:['No encontramos productos que coincidan con "',a,'"']}),(0,b.jsx)(h.Button,{asChild:!0,children:(0,b.jsx)(g.default,{href:"/productos",children:"Ver todos los productos"})})]})}async function j({searchParams:a}){let d=(await a).q||"";return(0,b.jsxs)("div",{className:"container py-8",children:[(0,b.jsxs)("div",{className:"mb-8",children:[(0,b.jsx)("h1",{className:"text-3xl font-bold mb-2",children:"Resultados de búsqueda"}),d&&(0,b.jsxs)("p",{className:"text-muted-foreground",children:["Buscando: ",(0,b.jsx)("span",{className:"font-medium text-foreground",children:d})]})]}),(0,b.jsx)(c.Suspense,{fallback:(0,b.jsx)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",children:Array.from({length:8}).map((a,c)=>(0,b.jsx)("div",{className:"h-80 bg-muted animate-pulse rounded-lg"},c))}),children:(0,b.jsx)(i,{query:d})})]})}a.s(["default",()=>j])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__70ec48dd._.js.map