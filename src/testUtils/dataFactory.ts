import * as faker from 'faker';
import { WebhookEvent, EventPayloads } from '@octokit/webhooks';
import { RestEndpointMethodTypes } from '@octokit/rest';
import { RaidStats } from '../raids/types/raidStats';
import chalk from 'chalk';

type BuildRepositoryEventProps = {
  eventType:
    | 'archived'
    | 'created'
    | 'deleted'
    | 'edited'
    | 'privatized'
    | 'publicized'
    | 'renamed'
    | 'transferred'
    | 'unarchived';
  isFork?: boolean;
  ownerName?: string;
  repoName?: string;
};

export const buildRepositoryEvent = ({
  eventType,
  isFork,
  ownerName,
  repoName,
}: BuildRepositoryEventProps): WebhookEvent<EventPayloads.WebhookPayloadRepository> => {
  const repository =
    repoName ??
    faker
      .fake('{{hacker.noun}}-{{hacker.verb}}')
      .replace(' ', '-')
      .toLowerCase();
  const repositoryId = faker.random.number({ min: 1, max: 200 });
  const owner = ownerName ?? faker.internet.userName().toLowerCase();
  const ownerId = faker.random.number({ min: 1, max: 200 });
  const repoNameWithOwner = `${owner}/${repository}`;

  const sender = faker.internet.userName();
  const senderId = faker.random.number({ min: 1, max: 200 });

  return {
    id: faker.random.uuid(),
    // @ts-ignore
    name: `repository.${eventType}`,
    payload: {
      action: eventType,
      repository: {
        id: repositoryId,
        node_id: 'MDEwOlJlcG9zaXRvcnkxMTg=',
        name: faker.random.word() + ' ' + faker.random.word(),
        full_name: repoNameWithOwner,
        private: false,
        owner: {
          login: owner,
          id: ownerId,
          node_id: 'MDEyOk9yZ2FuaXphdGlvbjc1NzUxMTIw',
          avatar_url: `https://avatars.githubusercontent.com/u/${ownerId}?v=4`,
          gravatar_id: '',
          url: `https://api.github.com/users/${owner}`,
          html_url: `https://github.com/${owner}`,
          followers_url: `https://api.github.com/users/${owner}/followers`,
          following_url: `https://api.github.com/users/${owner}/following{/other_user}`,
          gists_url: `https://api.github.com/users/${owner}/gists{/gist_id}`,
          starred_url: `https://api.github.com/users/${owner}/starred{/owner}{/repo}`,
          subscriptions_url: `https://api.github.com/users/${owner}/subscriptions`,
          organizations_url: `https://api.github.com/users/${owner}/orgs`,
          repos_url: `https://api.github.com/users/${owner}/repos`,
          events_url: `https://api.github.com/users/${owner}/events{/privacy}`,
          received_events_url: `https://api.github.com/users/${owner}/received_events`,
          type: 'Organization',
          site_admin: false,
        },
        html_url: `https://github.com/${repoNameWithOwner}`,
        description: '',
        fork: isFork ?? true,
        url: `https://api.github.com/repos/${repoNameWithOwner}`,
        forks_url: `https://api.github.com/repos/${repoNameWithOwner}/forks`,
        keys_url: `https://api.github.com/repos/${repoNameWithOwner}/keys{/key_id}`,
        collaborators_url: `https://api.github.com/repos/${repoNameWithOwner}/collaborators{/collaborator}`,
        teams_url: `https://api.github.com/repos/${repoNameWithOwner}/teams`,
        hooks_url: `https://api.github.com/repos/${repoNameWithOwner}/hooks`,
        issue_events_url: `https://api.github.com/repos/${repoNameWithOwner}/issues/events{/number}`,
        events_url: `https://api.github.com/repos/${repoNameWithOwner}/events`,
        assignees_url: `https://api.github.com/repos/${repoNameWithOwner}/assignees{/user}`,
        branches_url: `https://api.github.com/repos/${repoNameWithOwner}/branches{/branch}`,
        tags_url: `https://api.github.com/repos/${repoNameWithOwner}/tags`,
        blobs_url: `https://api.github.com/repos/${repoNameWithOwner}/git/blobs{/sha}`,
        git_tags_url: `https://api.github.com/repos/${repoNameWithOwner}/git/tags{/sha}`,
        git_refs_url: `https://api.github.com/repos/${repoNameWithOwner}/git/refs{/sha}`,
        trees_url: `https://api.github.com/repos/${repoNameWithOwner}/git/trees{/sha}`,
        statuses_url: `https://api.github.com/repos/${repoNameWithOwner}/statuses/{sha}`,
        languages_url: `https://api.github.com/repos/${repoNameWithOwner}/languages`,
        stargazers_url: `https://api.github.com/repos/${repoNameWithOwner}/stargazers`,
        contributors_url: `https://api.github.com/repos/${repoNameWithOwner}/contributors`,
        subscribers_url: `https://api.github.com/repos/${repoNameWithOwner}/subscribers`,
        subscription_url: `https://api.github.com/repos/${repoNameWithOwner}/subscription`,
        commits_url: `https://api.github.com/repos/${repoNameWithOwner}/commits{/sha}`,
        git_commits_url: `https://api.github.com/repos/${repoNameWithOwner}/git/commits{/sha}`,
        comments_url: `https://api.github.com/repos/${repoNameWithOwner}/comments{/number}`,
        issue_comment_url: `https://api.github.com/repos/${repoNameWithOwner}/issues/comments{/number}`,
        contents_url: `https://api.github.com/repos/${repoNameWithOwner}/contents/{+path}`,
        compare_url: `https://api.github.com/repos/${repoNameWithOwner}/compare/{base}...{head}`,
        merges_url: `https://api.github.com/repos/${repoNameWithOwner}/merges`,
        archive_url: `https://api.github.com/repos/${repoNameWithOwner}/{archive_format}{/ref}`,
        downloads_url: `https://api.github.com/repos/${repoNameWithOwner}/downloads`,
        issues_url: `https://api.github.com/repos/${repoNameWithOwner}/issues{/number}`,
        pulls_url: `https://api.github.com/repos/${repoNameWithOwner}/pulls{/number}`,
        milestones_url: `https://api.github.com/repos/${repoNameWithOwner}/milestones{/number}`,
        notifications_url: `https://api.github.com/repos/${repoNameWithOwner}/notifications{?since,all,participating}`,
        labels_url: `https://api.github.com/repos/${repoNameWithOwner}/labels{/name}`,
        releases_url: `https://api.github.com/repos/${repoNameWithOwner}/releases{/id}`,
        deployments_url: `https://api.github.com/repos/${repoNameWithOwner}/deployments`,
        created_at: '2021-02-03T00:05:29Z',
        updated_at: '2021-02-02T18:31:52Z',
        pushed_at: '2021-01-25T23:12:19Z',
        git_url: `git://github.com/${repoNameWithOwner}.git`,
        ssh_url: `git@github.com:${repoNameWithOwner}.git`,
        clone_url: `https://github.com/${repoNameWithOwner}.git`,
        svn_url: `https://github.com/${repoNameWithOwner}`,
        homepage: '',
        size: 212,
        stargazers_count: 0,
        watchers_count: 0,
        language: null,
        has_issues: false,
        has_projects: true,
        has_downloads: true,
        has_wiki: true,
        has_pages: false,
        forks_count: 0,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 0,
        license: null,
        forks: 0,
        open_issues: 0,
        watchers: 0,
        default_branch: 'main',
      },
      organization: {
        login: owner,
        id: ownerId,
        node_id: 'MDEyOk9yZ2FuaXphdGlvbjc1NzUxMTIw',
        url: `https://api.github.com/orgs/${owner}`,
        repos_url: `https://api.github.com/orgs/${owner}/repos`,
        events_url: `https://api.github.com/orgs/${owner}/events`,
        hooks_url: `https://api.github.com/orgs/${owner}/hooks`,
        issues_url: `https://api.github.com/orgs/${owner}/issues`,
        members_url: `https://api.github.com/orgs/${owner}/members{/member}`,
        public_members_url: `https://api.github.com/orgs/${owner}/public_members{/member}`,
        avatar_url: `https://avatars.githubusercontent.com/u/${ownerId}?v=4`,
        description: '',
      },
      sender: {
        login: sender,
        id: senderId,
        node_id: 'MDQ6VXNlcjIzMDI5OTAz',
        avatar_url: `https://avatars.githubusercontent.com/u/${senderId}?v=4`,
        gravatar_id: '',
        url: `https://api.github.com/users/${sender}`,
        html_url: `https://github.com/${sender}`,
        followers_url: `https://api.github.com/users/${sender}/followers`,
        following_url: `https://api.github.com/users/${sender}/following{/other_user}`,
        gists_url: `https://api.github.com/users/${sender}/gists{/gist_id}`,
        starred_url: `https://api.github.com/users/${sender}/starred{/owner}{/repo}`,
        subscriptions_url: `https://api.github.com/users/${sender}/subscriptions`,
        organizations_url: `https://api.github.com/users/${sender}/orgs`,
        repos_url: `https://api.github.com/users/${sender}/repos`,
        events_url: `https://api.github.com/users/${sender}/events{/privacy}`,
        received_events_url: `https://api.github.com/users/${sender}/received_events`,
        type: 'User',
        site_admin: false,
      },
    },
  };
};

type BuildRepositoryProps = {
  isForkedRepo?: boolean;
  ownerName?: string;
  repoName?: string;
  parentOwnerName?: string;
  parentRepoName?: string;
};

export const buildRepository = ({
  isForkedRepo,
  ownerName,
  repoName,
  parentOwnerName,
  parentRepoName,
}: BuildRepositoryProps = {}) => {
  const isFork = isForkedRepo ?? true;
  const repository =
    repoName ??
    faker
      .fake('{{hacker.noun}}-{{hacker.verb}}')
      .replace(' ', '-')
      .toLowerCase();
  const repositoryId = faker.random.number({ min: 1, max: 200 });
  const owner = ownerName ?? faker.internet.userName().toLowerCase();
  const ownerId = faker.random.number({ min: 1, max: 200 });
  const repoNameWithOwner = `${owner}/${repository}`;

  const parentRepository =
    parentRepoName ??
    faker
      .fake('{{hacker.noun}}-{{hacker.verb}}')
      .replace(' ', '-')
      .toLowerCase();
  const parentRepositoryId = faker.random.number({ min: 1, max: 200 });
  const parentOwner =
    parentOwnerName ?? faker.internet.userName().toLowerCase();
  const parentOwnerId = faker.random.number({ min: 1, max: 200 });
  const parentRepoNameWithOwner = `${parentOwner}/${parentRepository}`;

  const repositoryData: RestEndpointMethodTypes['repos']['get']['response']['data'] = {
    archive_url: `https://api.github.com/repos/${repoNameWithOwner}/{archive_format}{/ref}`,
    archived: false,
    assignees_url: `https://api.github.com/repos/${repoNameWithOwner}/assignees{/user}`,
    blobs_url: `https://api.github.com/repos/${repoNameWithOwner}/git/blobs{/sha}`,
    branches_url: `https://api.github.com/repos/${repoNameWithOwner}/branches{/branch}`,
    clone_url: `https://github.com/${repoNameWithOwner}.git`,
    collaborators_url: `https://api.github.com/repos/${repoNameWithOwner}/collaborators{/collaborator}`,
    comments_url: `https://api.github.com/repos/${repoNameWithOwner}/comments{/number}`,
    commits_url: `https://api.github.com/repos/${repoNameWithOwner}/commits{/sha}`,
    compare_url: `https://api.github.com/repos/${repoNameWithOwner}/compare/{base}...{head}`,
    contents_url: `https://api.github.com/repos/${repoNameWithOwner}/contents/{+path}`,
    contributors_url: `https://api.github.com/repos/${repoNameWithOwner}/contributors`,
    created_at: '2020-07-08T21:29:01Z',
    default_branch: 'main',
    deployments_url: `https://api.github.com/repos/${repoNameWithOwner}/deployments`,
    description: '',
    disabled: false,
    downloads_url: `https://api.github.com/repos/${repoNameWithOwner}/downloads`,
    events_url: `https://api.github.com/repos/${repoNameWithOwner}/events`,
    fork: isFork,
    forks: 0,
    forks_count: 0,
    forks_url: `https://api.github.com/repos/${repoNameWithOwner}/forks`,
    full_name: repoNameWithOwner,
    git_commits_url: `https://api.github.com/repos/${repoNameWithOwner}/git/commits{/sha}`,
    git_refs_url: `https://api.github.com/repos/${repoNameWithOwner}/git/refs{/sha}`,
    git_tags_url: `https://api.github.com/repos/${repoNameWithOwner}/git/tags{/sha}`,
    git_url: `git://github.com/${repoNameWithOwner}.git`,
    has_downloads: true,
    has_issues: true,
    has_pages: false,
    has_projects: true,
    has_wiki: true,
    homepage: '',
    hooks_url: `https://api.github.com/repos/${repoNameWithOwner}/hooks`,
    html_url: `https://github.com/${repoNameWithOwner}`,
    id: repositoryId,
    issue_comment_url: `https://api.github.com/repos/${repoNameWithOwner}/issues/comments{/number}`,
    issue_events_url: `https://api.github.com/repos/${repoNameWithOwner}/issues/events{/number}`,
    issues_url: `https://api.github.com/repos/${repoNameWithOwner}/issues{/number}`,
    keys_url: `https://api.github.com/repos/${repoNameWithOwner}/keys{/key_id}`,
    labels_url: `https://api.github.com/repos/${repoNameWithOwner}/labels{/name}`,
    language: 'JavaScript',
    languages_url: `https://api.github.com/repos/${repoNameWithOwner}/languages`,
    license: {
      key: 'mit',
      name: 'MIT License',
      node_id: 'MDc6TGljZW5zZTEz',
      spdx_id: 'MIT',
      url: 'https://api.github.com/licenses/mit',
    },
    merges_url: `https://api.github.com/repos/${repoNameWithOwner}/merges`,
    milestones_url: `https://api.github.com/repos/${repoNameWithOwner}/milestones{/number}`,
    mirror_url: null,
    name: repository,
    network_count: 0,
    node_id: 'MDEwOlJlcG9zaXRvcnkyNzgxOTgwNDc=',
    notifications_url: `https://api.github.com/repos/${repoNameWithOwner}/notifications{?since,all,participating}`,
    open_issues: 0,
    open_issues_count: 0,
    owner: {
      login: owner,
      id: ownerId,
      node_id: 'MDEyOk9yZ2FuaXphdGlvbjc1NzUxMTIw',
      avatar_url: `https://avatars.githubusercontent.com/u/${ownerId}?v=4`,
      gravatar_id: '',
      url: `https://api.github.com/users/${owner}`,
      html_url: `https://github.com/${owner}`,
      followers_url: `https://api.github.com/users/${owner}/followers`,
      following_url: `https://api.github.com/users/${owner}/following{/other_user}`,
      gists_url: `https://api.github.com/users/${owner}/gists{/gist_id}`,
      starred_url: `https://api.github.com/users/${owner}/starred{/owner}{/repo}`,
      subscriptions_url: `https://api.github.com/users/${owner}/subscriptions`,
      organizations_url: `https://api.github.com/users/${owner}/orgs`,
      repos_url: `https://api.github.com/users/${owner}/repos`,
      events_url: `https://api.github.com/users/${owner}/events{/privacy}`,
      received_events_url: `https://api.github.com/users/${owner}/received_events`,
      type: 'Organization',
      site_admin: false,
    },
    organization: {
      avatar_url: `https://avatars.githubusercontent.com/u/${ownerId}?v=4`,
      events_url: `https://api.github.com/users/${owner}/events{/privacy}`,
      followers_url: `https://api.github.com/users/${owner}/followers`,
      following_url: `https://api.github.com/users/${owner}/following{/other_user}`,
      gists_url: `https://api.github.com/users/${owner}/gists{/gist_id}`,
      gravatar_id: '',
      html_url: `https://github.com/${owner}`,
      id: ownerId,
      login: owner,
      node_id: 'MDEyOk9yZ2FuaXphdGlvbjc1NzUxMTIw',
      organizations_url: `https://api.github.com/users/${owner}/orgs`,
      received_events_url: `https://api.github.com/users/${owner}/received_events`,
      repos_url: `https://api.github.com/users/${owner}/repos`,
      site_admin: false,
      starred_url: `https://api.github.com/users/${owner}/starred{/owner}{/repo}`,
      subscriptions_url: `https://api.github.com/users/${owner}/subscriptions`,
      type: 'Organization',
      url: `https://api.github.com/users/${owner}`,
    },
    private: false,
    pulls_url: `https://api.github.com/repos/${repoNameWithOwner}/pulls{/number}`,
    pushed_at: '2020-12-13T00:46:08Z',
    releases_url: `https://api.github.com/repos/${repoNameWithOwner}/releases{/id}`,
    size: 1399,
    ssh_url: `git@github.com:${repoNameWithOwner}.git`,
    stargazers_count: 0,
    stargazers_url: `https://api.github.com/repos/${repoNameWithOwner}/stargazers`,
    statuses_url: `https://api.github.com/repos/${repoNameWithOwner}/statuses/{sha}`,
    subscribers_count: 0,
    subscribers_url: `https://api.github.com/repos/${repoNameWithOwner}/subscribers`,
    subscription_url: `https://api.github.com/repos/${repoNameWithOwner}/subscription`,
    svn_url: `https://github.com/${repoNameWithOwner}`,
    tags_url: `https://api.github.com/repos/${repoNameWithOwner}/tags`,
    teams_url: `https://api.github.com/repos/${repoNameWithOwner}/teams`,
    temp_clone_token: null,
    trees_url: `https://api.github.com/repos/${repoNameWithOwner}/git/trees{/sha}`,
    updated_at: '2020-12-08T00:50:39Z',
    url: `https://api.github.com/repos/${repoNameWithOwner}`,
    watchers: 0,
    watchers_count: 0,
  };

  if (isFork) {
    repositoryData.parent = {
      archive_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/{archive_format}{/ref}`,
      archived: false,
      assignees_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/assignees{/user}`,
      blobs_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/git/blobs{/sha}`,
      branches_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/branches{/branch}`,
      clone_url: `https://github.com/${parentRepoNameWithOwner}.git`,
      collaborators_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/collaborators{/collaborator}`,
      comments_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/comments{/number}`,
      commits_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/commits{/sha}`,
      compare_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/compare/{base}...{head}`,
      contents_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/contents/{+path}`,
      contributors_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/contributors`,
      created_at: '2017-07-05T06:07:37Z',
      default_branch: 'main',
      deployments_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/deployments`,
      description: '',
      disabled: false,
      downloads_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/downloads`,
      events_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/events`,
      fork: false,
      forks: 1,
      forks_count: 1,
      forks_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/forks`,
      full_name: parentRepoNameWithOwner,
      git_commits_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/git/commits{/sha}`,
      git_refs_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/git/refs{/sha}`,
      git_tags_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/git/tags{/sha}`,
      git_url: `git://github.com/${parentRepoNameWithOwner}.git`,
      has_downloads: true,
      has_issues: true,
      has_pages: false,
      has_projects: true,
      has_wiki: true,
      homepage: '',
      hooks_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/hooks`,
      html_url: `https://github.com/${parentRepoNameWithOwner}`,
      id: parentRepositoryId,
      issue_comment_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/issues/comments{/number}`,
      issue_events_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/issues/events{/number}`,
      issues_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/issues{/number}`,
      keys_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/keys{/key_id}`,
      labels_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/labels{/name}`,
      language: 'JavaScript',
      languages_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/languages`,
      license: {
        key: 'mit',
        name: 'MIT License',
        node_id: 'MDc6TGljZW5zZTEz',
        spdx_id: 'MIT',
        url: 'https://api.github.com/licenses/mit',
      },
      merges_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/merges`,
      milestones_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/milestones{/number}`,
      mirror_url: null,
      name: parentRepository,
      node_id: 'MDEwOlJlcG9zaXRvcnk5NjI4Mjc1MQ==',
      notifications_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/notifications{?since,all,participating}`,
      open_issues: 0,
      open_issues_count: 0,
      owner: {
        avatar_url: `https://avatars.githubusercontent.com/u/1500684?v=4`,
        events_url: `https://api.github.com/users/${parentOwner}/events{/privacy}`,
        followers_url: `https://api.github.com/users/${parentOwner}/followers`,
        following_url: `https://api.github.com/users/${parentOwner}/following{/other_user}`,
        gists_url: `https://api.github.com/users/${parentOwner}/gists{/gist_id}`,
        gravatar_id: '',
        html_url: `https://github.com/${parentOwner}`,
        id: parentOwnerId,
        login: parentOwner,
        node_id: 'MDQ6VXNlcjE1MDA2ODQ=',
        organizations_url: `https://api.github.com/users/${parentOwner}/orgs`,
        received_events_url: `https://api.github.com/users/${parentOwner}/received_events`,
        repos_url: `https://api.github.com/users/${parentOwner}/repos`,
        site_admin: false,
        starred_url: `https://api.github.com/users/${parentOwner}/starred{/owner}{/repo}`,
        subscriptions_url: `https://api.github.com/users/${parentOwner}/subscriptions`,
        type: 'User',
        url: `https://api.github.com/users/${parentOwner}`,
      },
      private: false,
      pulls_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/pulls{/number}`,
      pushed_at: '2021-02-06T09:46:59Z',
      releases_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/releases{/id}`,
      size: 212,
      ssh_url: `git@github.com:${parentRepoNameWithOwner}.git`,
      stargazers_count: 0,
      stargazers_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/stargazers`,
      statuses_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/statuses/{sha}`,
      subscribers_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/subscribers`,
      subscription_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/subscription`,
      svn_url: `https://github.com/${parentRepoNameWithOwner}`,
      tags_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/tags`,
      teams_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/teams`,
      trees_url: `https://api.github.com/repos/${parentRepoNameWithOwner}/git/trees{/sha}`,
      updated_at: '2021-02-02T18:31:52Z',
      url: `https://api.github.com/repos/${parentRepoNameWithOwner}`,
      watchers: 0,
      watchers_count: 0,
    };
  }

  return repositoryData;
};

type CommitUser = {
  name: string;
  email: string;
  username: string;
};

export type Commit = {
  id: string;
  tree_id: string;
  distinct: boolean;
  message: string;
  timestamp: string;
  url: string;
  author: CommitUser;
  committer: CommitUser;
  added: string[];
  removed: string[];
  modified: string[];
};

type BuildPushEventProps = {
  isFork?: boolean;
  isDefaultBranch?: boolean;
  isArchived?: boolean;
  ownerName?: string;
  repoName?: string;
  commits?: number;
};

export const buildPushEvent = ({
  isFork,
  isDefaultBranch,
  isArchived,
  ownerName,
  repoName,
  commits,
}: BuildPushEventProps = {}): WebhookEvent<EventPayloads.WebhookPayloadPush> => {
  const branch = isDefaultBranch ?? true ? 'main' : faker.git.branch();
  const branchRef = `refs/heads/${branch}`;
  const repository =
    repoName ??
    faker
      .fake('{{hacker.noun}}-{{hacker.verb}}')
      .replace(' ', '-')
      .toLowerCase();
  const repositoryId = faker.random.number({ min: 1, max: 200 });
  const owner = ownerName ?? faker.internet.userName().toLowerCase();
  const ownerId = faker.random.number({ min: 1, max: 200 });
  const repoNameWithOwner = `${owner}/${repository}`;

  const sender = faker.internet.userName();
  const senderEmail = faker.internet.exampleEmail();
  const senderId = faker.random.number({ min: 1, max: 200 });

  const beforeSha = faker.git.commitSha();
  const afterSha = faker.git.commitSha();

  const pushData: WebhookEvent<EventPayloads.WebhookPayloadPush> = {
    id: faker.random.uuid(),
    name: 'push',
    payload: {
      ref: branchRef,
      before: beforeSha,
      after: afterSha,
      repository: {
        id: repositoryId,
        node_id: 'MDEwOlJlcG9zaXRvcnkzMzU0NTgwMDA=',
        name: repository,
        full_name: repoNameWithOwner,
        private: false,
        owner: {
          name: owner,
          email: faker.internet.exampleEmail(),
          login: owner,
          id: ownerId,
          node_id: 'MDEyOk9yZ2FuaXphdGlvbjc1NzUxMTIw',
          avatar_url: `https://avatars.githubusercontent.com/u/${ownerId}?v=4`,
          gravatar_id: '',
          url: `https://api.github.com/users/${owner}`,
          html_url: `https://github.com/${owner}`,
          followers_url: `https://api.github.com/users/${owner}/followers`,
          following_url: `https://api.github.com/users/${owner}/following{/other_user}`,
          gists_url: `https://api.github.com/users/${owner}/gists{/gist_id}`,
          starred_url: `https://api.github.com/users/${owner}/starred{/owner}{/repo}`,
          subscriptions_url: `https://api.github.com/users/${owner}/subscriptions`,
          organizations_url: `https://api.github.com/users/${owner}/orgs`,
          repos_url: `https://api.github.com/users/${owner}/repos`,
          events_url: `https://api.github.com/users/${owner}/events{/privacy}`,
          received_events_url: `https://api.github.com/users/${owner}/received_events`,
          type: 'Organization',
          site_admin: false,
        },
        html_url: `https://github.com/${repoNameWithOwner}`,
        description: '',
        fork: isFork ?? true,
        url: `https://github.com/${repoNameWithOwner}`,
        forks_url: `https://api.github.com/repos/${repoNameWithOwner}/forks`,
        keys_url: `https://api.github.com/repos/${repoNameWithOwner}/keys{/key_id}`,
        collaborators_url: `https://api.github.com/repos/${repoNameWithOwner}/collaborators{/collaborator}`,
        teams_url: `https://api.github.com/repos/${repoNameWithOwner}/teams`,
        hooks_url: `https://api.github.com/repos/${repoNameWithOwner}/hooks`,
        issue_events_url: `https://api.github.com/repos/${repoNameWithOwner}/issues/events{/number}`,
        events_url: `https://api.github.com/repos/${repoNameWithOwner}/events`,
        assignees_url: `https://api.github.com/repos/${repoNameWithOwner}/assignees{/user}`,
        branches_url: `https://api.github.com/repos/${repoNameWithOwner}/branches{/branch}`,
        tags_url: `https://api.github.com/repos/${repoNameWithOwner}/tags`,
        blobs_url: `https://api.github.com/repos/${repoNameWithOwner}/git/blobs{/sha}`,
        git_tags_url: `https://api.github.com/repos/${repoNameWithOwner}/git/tags{/sha}`,
        git_refs_url: `https://api.github.com/repos/${repoNameWithOwner}/git/refs{/sha}`,
        trees_url: `https://api.github.com/repos/${repoNameWithOwner}/git/trees{/sha}`,
        statuses_url: `https://api.github.com/repos/${repoNameWithOwner}/statuses/{sha}`,
        languages_url: `https://api.github.com/repos/${repoNameWithOwner}/languages`,
        stargazers_url: `https://api.github.com/repos/${repoNameWithOwner}/stargazers`,
        contributors_url: `https://api.github.com/repos/${repoNameWithOwner}/contributors`,
        subscribers_url: `https://api.github.com/repos/${repoNameWithOwner}/subscribers`,
        subscription_url: `https://api.github.com/repos/${repoNameWithOwner}/subscription`,
        commits_url: `https://api.github.com/repos/${repoNameWithOwner}/commits{/sha}`,
        git_commits_url: `https://api.github.com/repos/${repoNameWithOwner}/git/commits{/sha}`,
        comments_url: `https://api.github.com/repos/${repoNameWithOwner}/comments{/number}`,
        issue_comment_url: `https://api.github.com/repos/${repoNameWithOwner}/issues/comments{/number}`,
        contents_url: `https://api.github.com/repos/${repoNameWithOwner}/contents/{+path}`,
        compare_url: `https://api.github.com/repos/${repoNameWithOwner}/compare/{base}...{head}`,
        merges_url: `https://api.github.com/repos/${repoNameWithOwner}/merges`,
        archive_url: `https://api.github.com/repos/${repoNameWithOwner}/{archive_format}{/ref}`,
        downloads_url: `https://api.github.com/repos/${repoNameWithOwner}/downloads`,
        issues_url: `https://api.github.com/repos/${repoNameWithOwner}/issues{/number}`,
        pulls_url: `https://api.github.com/repos/${repoNameWithOwner}/pulls{/number}`,
        milestones_url: `https://api.github.com/repos/${repoNameWithOwner}/milestones{/number}`,
        notifications_url: `https://api.github.com/repos/${repoNameWithOwner}/notifications{?since,all,participating}`,
        labels_url: `https://api.github.com/repos/${repoNameWithOwner}/labels{/name}`,
        releases_url: `https://api.github.com/repos/${repoNameWithOwner}/releases{/id}`,
        deployments_url: `https://api.github.com/repos/${repoNameWithOwner}/deployments`,
        created_at: 1612310729,
        updated_at: '2021-02-06T09:47:00Z',
        pushed_at: 1612649715,
        git_url: `git://github.com/${repoNameWithOwner}.git`,
        ssh_url: `git@github.com:${repoNameWithOwner}.git`,
        clone_url: `https://github.com/${repoNameWithOwner}.git`,
        svn_url: `https://github.com/${repoNameWithOwner}`,
        homepage: '',
        size: 259,
        stargazers_count: 0,
        watchers_count: 0,
        language: 'TypeScript',
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: true,
        has_pages: false,
        forks_count: 0,
        mirror_url: null,
        archived: isArchived ?? false,
        disabled: false,
        open_issues_count: 0,
        license: {
          key: 'mit',
          name: 'MIT License',
          spdx_id: 'MIT',
          url: 'https://api.github.com/licenses/mit',
          node_id: 'MDc6TGljZW5zZTEz',
        },
        forks: 0,
        open_issues: 0,
        watchers: 0,
        default_branch: 'main',
        stargazers: 0,
        master_branch: 'main',
      },
      pusher: {
        name: sender,
        email: senderEmail,
      },
      organization: {
        login: owner,
        id: ownerId,
        node_id: 'MDEyOk9yZ2FuaXphdGlvbjc1NzUxMTIw',
        url: `https://api.github.com/orgs/${owner}`,
        repos_url: `https://api.github.com/orgs/${owner}/repos`,
        events_url: `https://api.github.com/orgs/${owner}/events`,
        hooks_url: `https://api.github.com/orgs/${owner}/hooks`,
        issues_url: `https://api.github.com/orgs/${owner}/issues`,
        members_url: `https://api.github.com/orgs/${owner}/members{/member}`,
        public_members_url: `https://api.github.com/orgs/${owner}/public_members{/member}`,
        avatar_url: `https://avatars.githubusercontent.com/u/${ownerId}?v=4`,
        description: '',
      } as EventPayloads.WebhookPayloadPushOrganization,
      sender: {
        login: sender,
        id: senderId,
        node_id: 'MDQ6VXNlcjIzMDI5OTAz',
        avatar_url: `https://avatars.githubusercontent.com/u/${senderId}?v=4`,
        gravatar_id: '',
        url: `https://api.github.com/users/${sender}`,
        html_url: `https://github.com/${sender}`,
        followers_url: `https://api.github.com/users/${sender}/followers`,
        following_url: `https://api.github.com/users/${sender}/following{/other_user}`,
        gists_url: `https://api.github.com/users/${sender}/gists{/gist_id}`,
        starred_url: `https://api.github.com/users/${sender}/starred{/owner}{/repo}`,
        subscriptions_url: `https://api.github.com/users/${sender}/subscriptions`,
        organizations_url: `https://api.github.com/users/${sender}/orgs`,
        repos_url: `https://api.github.com/users/${sender}/repos`,
        events_url: `https://api.github.com/users/${sender}/events{/privacy}`,
        received_events_url: `https://api.github.com/users/${sender}/received_events`,
        type: 'User',
        site_admin: false,
      },
      created: false,
      deleted: false,
      forced: false,
      base_ref: null,
      compare: `https://github.com/${repoNameWithOwner}/compare/${beforeSha.substr(
        0,
        12
      )}...${afterSha.substr(0, 12)}`,
      commits: [],
      head_commit: null,
    },
  };

  const commitsData: Commit[] = [];
  for (
    let i = 0;
    i < (commits ?? faker.random.number({ min: 1, max: 10 }));
    ++i
  ) {
    const user: CommitUser = {
      name: faker.fake('{{name.firstName}} {{name.lastName}}'),
      email: faker.internet.exampleEmail(),
      username: faker.internet.userName(),
    };
    const commitId = faker.git.commitSha();

    commitsData.push({
      id: commitId,
      tree_id: faker.git.commitSha(),
      distinct: false,
      message:
        faker.random.arrayElement(['chore', 'fix', 'test', 'feat', 'docs']) +
        ': ' +
        faker.git.commitMessage(),
      timestamp: '2021-02-06T23:07:08+01:00',
      url: `https://github.com/${repoNameWithOwner}/commit/${commitId}`,
      author: user,
      committer: user,
      added: new Array(faker.random.number(5)).map((_) =>
        faker.system.filePath()
      ),
      removed: new Array(faker.random.number(5)).map((_) =>
        faker.system.filePath()
      ),
      modified: new Array(faker.random.number(5)).map((_) =>
        faker.system.filePath()
      ),
    });
  }

  pushData.payload.commits = commitsData;

  return pushData;
};

export const buildRaidStats = ({
  additions,
  changedFiles,
  commits,
  contributors,
  deletions,
  dungeon,
  status,
  title,
  createdAt,
}: Partial<RaidStats> = {}): RaidStats => ({
  additions: additions ?? 0,
  changedFiles: changedFiles ?? 0,
  commits: commits ?? 0,
  contributors: contributors ?? {},
  deletions: deletions ?? 0,
  dungeon:
    dungeon ??
    faker
      .fake('{{internet.userName}}/{{hacker.noun}}-{{hacker.verb}}')
      .replace(' ', '-')
      .toLowerCase(),
  status: status ?? 'active',
  title: title ?? faker.random.words(),
  createdAt: createdAt ?? faker.date.recent(3).setHours(0, 0, 0, 0),
  files: {},
  discordMessageId: faker.random.number({ min: 1, max: 10000000 }).toString(),
});

type BuildCommitProps = {
  ownerName?: string;
  repoName?: string;
  multipleParents?: boolean;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  hasAuthor?: boolean;
};

export const buildCommit = ({
  ownerName,
  repoName,
  multipleParents,
  additions,
  deletions,
  changedFiles,
  hasAuthor,
}: BuildCommitProps) => {
  const owner = ownerName ?? faker.internet.userName().toLowerCase();
  const repository =
    repoName ??
    faker
      .fake('{{hacker.noun}}-{{hacker.verb}}')
      .replace(' ', '-')
      .toLowerCase();
  const repoNameWithOwner = `${owner}/${repository}`;
  const commitId = faker.git.commitSha();
  const treeId = faker.git.commitSha();
  const totalAdditions = additions ?? faker.random.number(1000);
  const totalDeletions = deletions ?? faker.random.number(1000);
  const withAuthor = hasAuthor ?? true;
  const authorName = faker.fake('{{name.firstName}} {{name.lastName}}');
  const authorNames = authorName.split(' ');
  const authorEmail = faker.internet.exampleEmail(
    authorNames[0],
    authorNames[1]
  );
  const authorUsername = faker.internet.userName(
    authorNames[0],
    authorNames[1]
  );

  const getCommitParents = () => {
    const parentCommitId1 = faker.git.commitSha();
    const parents = [
      {
        url: `https://api.github.com/repos/${repoNameWithOwner}/commits/${parentCommitId1}`,
        sha: parentCommitId1,
      },
    ];

    if (multipleParents ?? false) {
      const parentCommitId2 = faker.git.commitSha();
      parents.push({
        url: `https://api.github.com/repos/${repoNameWithOwner}/commits/${parentCommitId2}`,
        sha: parentCommitId2,
      });
    }

    return parents;
  };

  const distribute = (total: number, items: number): number[] => {
    const results = new Array(items).fill(Math.floor(total / items));

    const roundingRemainder = total % items;
    if (roundingRemainder !== 0) {
      results[items - 1] += roundingRemainder;
    }

    return results;
  };

  const getCommitFiles = () => {
    const fileChanges = distribute(
      totalAdditions + totalDeletions,
      changedFiles ?? faker.random.number(10)
    );

    return fileChanges.map((total) => {
      const fileId = faker.git.commitSha();
      const fileName = faker.system.filePath().replace(/^\//, '');

      const isAdditions = faker.random.boolean();
      const additions = isAdditions ? total : 0;
      const deletions = isAdditions ? 0 : total;

      return {
        filename: fileName,
        additions,
        deletions,
        changes: total,
        status: 'modified',
        raw_url: `https://github.com/${repoNameWithOwner}/raw/${fileId}/${fileName}`,
        blob_url: `https://github.com/${repoNameWithOwner}/blob/${fileId}/${fileName}`,
        patch: '@@ -29,7 +29,7 @@\n.....',
      };
    });
  };

  return {
    url: `https://api.github.com/repos/${repoNameWithOwner}/commits/${commitId}`,
    sha: commitId,
    node_id:
      'MDY6Q29tbWl0NmRjYjA5YjViNTc4NzVmMzM0ZjYxYWViZWQ2OTVlMmU0MTkzZGI1ZQ==',
    html_url: `https://github.com/${repoNameWithOwner}/commit/${commitId}`,
    comments_url: `https://api.github.com/repos/${repoNameWithOwner}/commits/${commitId}/comments`,
    commit: {
      url: `https://api.github.com/repos/${repoNameWithOwner}/git/commits/${commitId}`,
      author: {
        name: authorName,
        email: authorEmail,
        date: '2011-04-14T16:00:49Z',
      },
      committer: {
        name: authorName,
        email: authorEmail,
        date: '2011-04-14T16:00:49Z',
      },
      message: faker.git.commitMessage(),
      tree: {
        url: `https://api.github.com/repos/${repoNameWithOwner}/tree/${treeId}`,
        sha: treeId,
      },
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null,
      },
    },
    author: {
      login: withAuthor ? authorUsername : null,
      id: withAuthor ? 1 : null,
      node_id: 'MDQ6VXNlcjE=',
      avatar_url: withAuthor
        ? `https://github.com/images/error/octocat_happy.gif`
        : null,
      gravatar_id: '',
      url: `https://api.github.com/users/${authorUsername}`,
      html_url: `https://github.com/${authorUsername}`,
      followers_url: `https://api.github.com/users/${authorUsername}/followers`,
      following_url: `https://api.github.com/users/${authorUsername}/following{/other_user}`,
      gists_url: `https://api.github.com/users/${authorUsername}/gists{/gist_id}`,
      starred_url: `https://api.github.com/users/${authorUsername}/starred{/owner}{/repo}`,
      subscriptions_url: `https://api.github.com/users/${authorUsername}/subscriptions`,
      organizations_url: `https://api.github.com/users/${authorUsername}/orgs`,
      repos_url: `https://api.github.com/users/${authorUsername}/repos`,
      events_url: `https://api.github.com/users/${authorUsername}/events{/privacy}`,
      received_events_url: `https://api.github.com/users/${authorUsername}/received_events`,
      type: 'User',
      site_admin: false,
    },
    committer: {
      login: authorUsername,
      id: 1,
      node_id: 'MDQ6VXNlcjE=',
      avatar_url: `https://github.com/images/error/octocat_happy.gif`,
      gravatar_id: '',
      url: `https://api.github.com/users/${authorUsername}`,
      html_url: `https://github.com/${authorUsername}`,
      followers_url: `https://api.github.com/users/${authorUsername}/followers`,
      following_url: `https://api.github.com/users/${authorUsername}/following{/other_user}`,
      gists_url: `https://api.github.com/users/${authorUsername}/gists{/gist_id}`,
      starred_url: `https://api.github.com/users/${authorUsername}/starred{/owner}{/repo}`,
      subscriptions_url: `https://api.github.com/users/${authorUsername}/subscriptions`,
      organizations_url: `https://api.github.com/users/${authorUsername}/orgs`,
      repos_url: `https://api.github.com/users/${authorUsername}/repos`,
      events_url: `https://api.github.com/users/${authorUsername}/events{/privacy}`,
      received_events_url: `https://api.github.com/users/${authorUsername}/received_events`,
      type: 'User',
      site_admin: false,
    },
    parents: getCommitParents(),
    stats: {
      additions: totalAdditions,
      deletions: totalDeletions,
      total: totalAdditions + totalDeletions,
    },
    files: getCommitFiles(),
  };
};
