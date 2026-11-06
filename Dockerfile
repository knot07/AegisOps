FROM node:22-bookworm AS node
FROM python:3.12-bookworm
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates fonts-noto-cjk libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/aegisops
COPY . .
RUN python -m pip install --no-cache-dir -r requirements.lock && python -m pip install --no-cache-dir --no-deps -e . -e defaults/plugins/aegis-scenes-runtime && cd webui && npm ci --include=dev && npm run build
RUN useradd --uid 10001 --create-home --shell /bin/bash aegisops && mkdir -p /var/lib/aegisops && chown -R aegisops:aegisops /opt/aegisops /var/lib/aegisops
USER aegisops
ENV AEGISOPS_ROOT=/var/lib/aegisops PYTHONUNBUFFERED=1
EXPOSE 5200
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5200/api/health',timeout=4)"
CMD ["python","run.py","--host","0.0.0.0","--port","5200"]
