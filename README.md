
<p align="center">
  <img src="/src/icons/android-chrome-192x192.png" />
</p>

<h1 align="center">paste</h1>
<p align="center">syncronized quick notes <s>with client side encryption</s></p>

### But, why 

This is a fullstack webapp with only 2 files !! (+config files 🫠)

Stack:
- Layout: HTML
- Styling: Tailwindcss
- Interactivity: HTMX + Hyperscript
- HTTP Server: Bun
- Hosting: Fly.io
- Database: Redis

### Privacy

All pastes are **public**, so anyone can access them. Don't store anything personal.  
Redis eviction is enabled, which means that old data can be removed at random if max memory is reached. (it won't)  
I reserve the right to obliterate the database if something goes wrong.
