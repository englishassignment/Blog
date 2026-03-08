name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Inject API Key
        run: |
          # This command swaps the placeholder for your GitHub Secret
          sed -i 's/___REPLACE_ME_WITH_REAL_KEY___/${{ secrets.GOOGLE_API_KEY }}/g' app.js

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
            
