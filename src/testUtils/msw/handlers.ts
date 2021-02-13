import { response, rest } from 'msw';
import { buildRepository } from '../dataFactory';

export const handlers = [
  rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
    const { owner, repo } = req.params;

    return res(
      ctx.json(
        buildRepository({
          isForkedRepo: true,
          ownerName: owner,
          repoName: repo,
        })
      )
    );
  }),
  rest.get(
    'https://github.com/:owner/:repo/branch_commits/:ref',
    (req, res, ctx) => {
      return res(
        ctx.text(
          `<svg class="octicon octicon-git-branch" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"></path></svg><ul class="js-branches-list"><li class="branch">This commit does not belong to any branch on this repository.</li></ul>`
        )
      );
    }
  ),
  rest.get('*', (req, res, ctx) => {
    const warning = `${req.url} has not been mocked yet... Maybe now is a good time to do that`;
    console.warn(warning);
    return res(ctx.json(warning));
  }),
];
