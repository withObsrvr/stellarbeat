import { Server } from 'net';
import express from 'express';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

export class MockHistoryArchive {
	private server?: Server;
	private api = express();

	async listen(port = 3000) {
		return new Promise<void>((resolve, reject) => {
			this.api.use(
				rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 })
			);

			// Match any path ending in .json (including nested paths like /history/00/00/00/file.json)
			this.api.get(
				/.*\.json$/,
				async (req: express.Request, res: express.Response) => {
					const file = path.join(
						__dirname,
						'/__fixtures__/',
						path.basename(req.path)
					);
					if (!fs.existsSync(file)) {
						res.status(404).send('Not found');
						return;
					}
					const content = fs.readFileSync(file, { encoding: 'utf8' });
					res.send(content);
				}
			);
			// Match any path ending in .xdr.gz (including nested paths)
			this.api.get(
				/.*\.xdr\.gz$/,
				async (req: express.Request, res: express.Response) => {
					const file = path.join(
						__dirname,
						'/__fixtures__/',
						path.basename(req.path)
					);
					if (!fs.existsSync(file)) {
						res.status(404).send('Not found');
						return;
					}
					fs.createReadStream(file).pipe(res);
				}
			);
			this.api.head(
				'*',
				async (req: express.Request, res: express.Response) => {
					res.status(200).send('go');
				}
			);

			this.server = this.api.listen(port, () => resolve());
		});
	}

	async stop() {
		return new Promise<void>((resolve, reject) => {
			if (!this.server) return;
			this.server.close(async () => {
				resolve();
			});
		});
	}
}
