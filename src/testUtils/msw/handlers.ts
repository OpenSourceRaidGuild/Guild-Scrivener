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
  rest.get('https://api.github.com/*', (req, res, ctx) => {
    return res(
      ctx.json(
        `This GitHub API route has not been mocked yet... Maybe now is a good time to do that`
      )
    );
  }),
];
