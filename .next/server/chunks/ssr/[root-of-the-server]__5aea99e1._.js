module.exports=[193695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70864,a=>{a.n(a.i(233290))},102894,a=>{a.n(a.i(666188))},13718,a=>{a.n(a.i(685523))},118198,a=>{a.n(a.i(545518))},262212,a=>{a.n(a.i(866114))},640088,a=>{"use strict";var b=a.i(907997),c=a.i(289246),d=a.i(596942),e=a.i(182248);let f=(0,d.cva)("inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",secondary:"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",destructive:"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",outline:"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"}},defaultVariants:{variant:"default"}});function g({className:a,variant:d,asChild:g=!1,...h}){let i=g?c.Slot:"span";return(0,b.jsx)(i,{"data-slot":"badge",className:(0,e.cn)(f({variant:d}),a),...h})}a.s(["Badge",()=>g])},267713,a=>{"use strict";var b=a.i(998310);async function c(){let a=await (0,b.createClient)(),{data:c,error:d}=await a.from("silos").select(`
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
    `).order("name");if(d)throw d;return c}async function m(a,c=3){let d=await (0,b.createClient)(),{data:e}=await d.from("blog_post_categories").select("category_id").eq("post_id",a);if(!e||0===e.length){let{data:b,error:e}=await d.from("blog_posts").select("id, slug, title, excerpt, featured_image_url, published_at").eq("status","published").neq("id",a).order("published_at",{ascending:!1}).limit(c);return b||[]}let f=e.map(a=>a.category_id),{data:g}=await d.from("blog_post_categories").select("post_id").in("category_id",f).neq("post_id",a);if(!g||0===g.length)return[];let h=[...new Set(g.map(a=>a.post_id))],{data:i,error:j}=await d.from("blog_posts").select("id, slug, title, excerpt, featured_image_url, published_at").eq("status","published").in("id",h).order("published_at",{ascending:!1}).limit(c);return i||[]}a.s(["getAvailableProductTypesBySubcategory",()=>f,"getBlogCategories",()=>l,"getBlogPostBySlug",()=>j,"getBlogPosts",()=>i,"getBlogPostsByCategory",()=>k,"getProductBySlug",()=>d,"getProductsBySubcategoryAndType",()=>g,"getRelatedBlogPosts",()=>m,"getSilosWithSubcategories",()=>c,"searchProducts",()=>h])},388729,a=>{"use strict";let b=(0,a.i(701269).default)("CalendarDays",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]]);a.s(["CalendarDays",()=>b],388729)},52289,a=>{"use strict";var b=a.i(907997),c=a.i(267713),d=a.i(529171),e=a.i(640088),f=a.i(395936),g=a.i(503236),h=a.i(388729);async function i(){let a=await (0,c.getBlogPosts)(20),i=await (0,c.getBlogCategories)();return(0,b.jsxs)("div",{className:"min-h-screen bg-background",children:[(0,b.jsx)("section",{className:"py-12 px-4 bg-gradient-to-b from-primary/5 to-background",children:(0,b.jsxs)("div",{className:"container mx-auto",children:[(0,b.jsx)("h1",{className:"text-4xl md:text-5xl font-bold mb-4",children:"Nuestra Mesa"}),(0,b.jsx)("p",{className:"text-lg text-muted-foreground max-w-2xl",children:"Historias, tendencias y consejos sobre decoración de mesa, productos para el hogar y el arte de recibir"})]})}),(0,b.jsx)("div",{className:"container mx-auto py-12 px-4",children:(0,b.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-4 gap-8",children:[(0,b.jsx)("div",{className:"lg:col-span-3",children:(0,b.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:a.map(a=>(0,b.jsx)(f.default,{href:`/blog/${a.slug}`,children:(0,b.jsxs)(d.Card,{className:"h-full hover:shadow-lg transition-shadow cursor-pointer group",children:[a.featured_image_url&&(0,b.jsx)("div",{className:"relative aspect-video w-full overflow-hidden rounded-t-lg",children:(0,b.jsx)(g.default,{src:a.featured_image_url,alt:a.title,fill:!0,className:"object-cover group-hover:scale-105 transition-transform duration-300",sizes:"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"})}),(0,b.jsxs)(d.CardHeader,{children:[(0,b.jsxs)("div",{className:"flex items-center gap-2 text-sm text-muted-foreground mb-2",children:[(0,b.jsx)(h.CalendarDays,{className:"h-4 w-4"}),(0,b.jsx)("time",{dateTime:a.published_at,children:new Date(a.published_at).toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"})})]}),(0,b.jsx)(d.CardTitle,{className:"group-hover:text-primary transition-colors line-clamp-2",children:a.title}),(0,b.jsx)(d.CardDescription,{className:"line-clamp-3",children:a.excerpt})]}),(0,b.jsx)(d.CardContent,{children:(0,b.jsx)("span",{className:"text-sm text-primary font-medium",children:"Leer más →"})})]})},a.id))})}),(0,b.jsx)("aside",{className:"lg:col-span-1",children:(0,b.jsx)("div",{className:"sticky top-4",children:(0,b.jsxs)(d.Card,{children:[(0,b.jsx)(d.CardHeader,{children:(0,b.jsx)(d.CardTitle,{children:"Categorías"})}),(0,b.jsx)(d.CardContent,{children:(0,b.jsx)("div",{className:"flex flex-col gap-2",children:i.map(a=>(0,b.jsxs)(f.default,{href:`/blog/categoria/${a.slug}`,className:"flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors",children:[(0,b.jsx)("span",{className:"text-sm",children:a.name}),(0,b.jsx)(e.Badge,{variant:"secondary",children:a.blog_post_categories?.[0]?.count||0})]},a.id))})})]})})})]})})]})}a.s(["default",()=>i,"metadata",0,{title:"Nuestra Mesa - Blog de Mesanova",description:"Artículos, tendencias y consejos sobre decoración de mesa y hogar"}])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__5aea99e1._.js.map