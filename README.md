# Mahjong Scorekeeper

[View Demo](https://mahjong.alextran.org/)

A web app for scorekeeping Cantonese/Hong Kong-style Mahjong games with support for:

- Full and shared gun scoring
- Self-drawn win scoring
- Faan-based point calculation
- Wind position and dealer tracking
- Score history
- Dice rolling
- Browser storage for game data
 
It uses this faan-to-points conversion table: 

| Faan | Self-Draw | Discard |
|------|------------|---------|
| 1    | 2          | 4       |
| 2    | 4          | 8       |
| 3    | 8          | 16      |
| 4    | 16         | 32      |
| 5    | 32         | 64      |
| 6    | 48         | 96      |
| 7    | 64         | 128     |
| 8    | 96         | 192     |
| 9    | 128        | 256     |
| 10   | 192        | 384     |
| 11   | 256        | 512     |
| 12   | 384        | 768     |
| 13   | 512        | 1024    |

## Feature or Variation Request

I built this for my uncle with his input, but I don't know much about the game. From what I gather, there are other common variations and/or house rules. 

If you have a feature request or a variation you'd like supported, please let me know by [submitting an issue](https://github.com/byalextran/mahjong-scorekeeper/issues)! 

## Deploy to Cloudflare Pages

Only needed if you want to make modifications and host the app yourself. The latest version will always be available at [mahjong.alextran.org](https://mahjong.alextran.org/). 

```bash
npm install
npm run deploy
```

The build script generates cache-busted assets in `dist/` before deploying.

## License

MIT
