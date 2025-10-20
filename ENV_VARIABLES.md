# Required Environment Variables

## For Vercel Deployment

Make sure these environment variables are set in Vercel:

### JSONBin.io
- `NEXT_PUBLIC_JSONBIN_API_KEY` - Your JSONBin.io API key
- `NEXT_PUBLIC_INDEX_BIN_ID` - The ID of your index bin (from /admin/setup-index)

### Socket.io Server
- `NEXT_PUBLIC_SOCKET_URL` - URL to your Railway socket server (e.g., https://kopfrechnen-production.up.railway.app)

## How to set in Vercel

1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add each variable with its value
4. Redeploy after adding variables

## Getting the Index Bin ID

1. Deploy the app once (it will use a temporary index)
2. Go to /admin/setup-index
3. Click "Index-Bin erstellen"
4. Copy the created Bin ID
5. Add it to Vercel as `NEXT_PUBLIC_INDEX_BIN_ID`
6. Redeploy

