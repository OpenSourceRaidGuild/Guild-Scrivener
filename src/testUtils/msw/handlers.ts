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
];
