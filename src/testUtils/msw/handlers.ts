import { rest } from 'msw';

export const handlers = [
  rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
    return res(
      ctx.json({
        message: 'nope. nothing',
        owner: req.params.owner,
        repo: req.params.repo,
      })
    );
  }),
];
