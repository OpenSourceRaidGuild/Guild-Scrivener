import { response, rest } from 'msw';
import { buildRepository } from '../dataFactory';

export const handlers = [
  rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
    const { owner, repo } = req.params;

    return res(
      ctx.json(
        buildRepository({
          isFork: true,
          ownerName: owner,
          repoName: repo,
        })
      )
    );
  }),
  rest.get('*', (req, res, ctx) => {
    const warning = `${req.url} has not been mocked yet... Maybe now is a good time to do that`;
    console.warn(warning);
    return res(ctx.json(warning));
  }),
];
