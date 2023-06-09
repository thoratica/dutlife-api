import { initTRPC } from '@trpc/server';
import z from 'zod';
import { graphql } from './utils/graphql.ts';

const { procedure, router } = initTRPC.create();

export const appRouter = router({
  search: procedure
    .input(z.object({ query: z.string(), display: z.number() }))
    .query(async ({ input: { query, display } }) => {
      const data = await graphql<{
        searchUserByUsername: {
          id: string;
          username: string;
          nickname: string;
          description: string;
          profileImage: { filename: string; imageType: string };
          coverImage: { filename: string; imageType: string };
          role: string;
          created: string;
          status: {
            following: number;
            follower: number;
            project: number;
            projectAll: number;
          };
        };
        searchUserByNickname: {
          id: string;
          username: string;
          nickname: string;
          description: string;
          profileImage: { filename: string; imageType: string };
          coverImage: { filename: string; imageType: string };
          role: string;
          created: string;
          status: {
            following: number;
            follower: number;
            project: number;
            projectAll: number;
          };
        };
        searchProjects: {
          total: number;
          list: {
            id: string;
            name: string;
            user: {
              id: string;
              username: string;
              nickname: string;
              profileImage: { filename: string; imageType: string };
            };
            thumb: string;
            categoryCode: string;
            created: string;
            updated: string;
            staffPicked: string;
            ranked: string;
            visit: number;
            likeCnt: number;
            comment: number;
          }[];
          searchAfter: [number, number, number];
        };
        searchDiscuss: {
          total: number;
          list: {
            id: string;
            title: string;
            content: string;
            user: {
              id: string;
              username: string;
              nickname: string;
              profileImage: { filename: string; imageType: string };
            };
            category: string;
            created: string;
            visit: number;
            likesLength: number;
            commentsLength: number;
            bestComment: {
              id: string;
              content: string;
              user: {
                id: string;
                username: string;
                nickname: string;
                profileImage: { filename: string; imageType: string };
              };
              likesLength: number;
            };
          }[];
          searchAfter: [number, number, number];
        };
      }>(
        `query ($query: String, $display: Int) {
        searchUserByUsername: user(username: $query) {
          id
          username
          nickname
          description
          profileImage {
            filename
            imageType
          }
          coverImage {
            filename
            imageType
          }
          role
          created
          status {
            following
            follower
            project
            projectAll
          }
        }
        searchUserByNickname: user(nickname: $query) {
          id
          username
          nickname
          description
          profileImage {
            filename
            imageType
          }
          coverImage {
            filename
            imageType
          }
          role
          created
          status {
            following
            follower
            project
            projectAll
          }
        }
        searchProjects: projectList(
          query: $query
          pageParam: { sorts: ["_score", "likeCnt"], display: $display }
          searchType: "scroll"
        ) {
          total
          list {
            id
            name
            user {
              id
              username
              nickname
              profileImage {
                filename
                imageType
              }
            }
            thumb
            categoryCode
            created
            updated
            staffPicked
            ranked
            visit
            likeCnt
            comment
          }
          searchAfter
        }
        searchDiscuss: discussList(
          pageParam: { sort: "score", display: $display }
          query: $query
          searchType: "scroll"
        ) {
          total
          list {
            id
            title
            content
            user {
              id
              username
              nickname
              profileImage {
                filename
                imageType
              }
            }
            category
            created
            visit
            likesLength
            commentsLength
            bestComment {
              id
              content
              user {
                id
                username
                nickname
                profileImage {
                  filename
                  imageType
                }
              }
              likesLength
            }
          }
          searchAfter
        }
      }`,
        { query, display },
      );

      const users: {
        id: string;
        username: string;
        nickname: string;
        description: string;
        profileImage?: string;
        coverImage?: string;
        role: string;
        joined: string;
        followers: number;
        followings: number;
        badges: { label: string; image: string }[];
        privateProjects: number;
        projects: {
          id: string;
          name: string;
          thumb?: string;
          category: string;
          created: string;
          updated: string;
          staffPicked: string;
          ranked: string;
          views: number;
          likes: number;
          comments: number;
          remakes: number;
        }[];
      }[] = [];

      const isSameUser =
        data.searchUserByUsername &&
        data.searchUserByNickname &&
        data.searchUserByUsername.id === data.searchUserByNickname.id;

      const data2Promises: (
        | Promise<{
            getUserBadges: {
              contest: { name: string };
              badgeText: string;
              bannerImageData: { path: string };
            }[];
            getUserProjects: {
              list: {
                id: string;
                name: string;
                thumb: string;
                categoryCode: string;
                created: string;
                updated: string;
                staffPicked: string;
                ranked: string;
                visit: number;
                likeCnt: number;
                comment: number;
                childCnt: number;
              }[];
            };
          }>
        | Promise<undefined>
      )[] = [Promise.resolve(undefined), Promise.resolve(undefined)];

      if (data.searchUserByUsername) {
        data2Promises[0] = graphql<{
          getUserBadges: {
            contest: { name: string };
            badgeText: string;
            bannerImageData: { path: string };
          }[];
          getUserProjects: {
            list: {
              id: string;
              name: string;
              thumb: string;
              categoryCode: string;
              created: string;
              updated: string;
              staffPicked: string;
              ranked: string;
              visit: number;
              likeCnt: number;
              comment: number;
              childCnt: number;
            }[];
          };
        }>(
          `query ($id: String!, $projects: Int) {
        getUserBadges: userContestPrizes(id: $id) {
          contest {
            name
          }
          badgeText
          bannerImageData {
            path
          }
        }
        getUserProjects: userProjectList(
          user: $id
          pageParam: { sort: "created", display: $projects }
          searchType: "scroll"
          term: "all"
        ) {
          list {
            id
            name
            thumb
            categoryCode
            created
            updated
            staffPicked
            ranked
            visit
            likeCnt
            comment
            childCnt
          }
        }
      }
      `,
          {
            id: data.searchUserByUsername.id,
            projects: data.searchUserByUsername.status.project,
          },
        );
      }
      if (!isSameUser && data.searchUserByNickname)
        data2Promises[1] = graphql<{
          getUserBadges: {
            contest: { name: string };
            badgeText: string;
            bannerImageData: { path: string };
          }[];
          getUserProjects: {
            list: {
              id: string;
              name: string;
              thumb: string;
              categoryCode: string;
              created: string;
              updated: string;
              staffPicked: string;
              ranked: string;
              visit: number;
              likeCnt: number;
              comment: number;
              childCnt: number;
            }[];
          };
        }>(
          `query ($id: String!, $projects: Int) {
          getUserBadges: userContestPrizes(id: $id) {
            contest {
              name
            }
            badgeText
            bannerImageData {
              path
            }
          }
          getUserProjects: userProjectList(
            user: $id
            pageParam: { sort: "created", display: $projects }
            searchType: "scroll"
            term: "all"
          ) {
            list {
              id
              name
              thumb
              categoryCode
              created
              updated
              staffPicked
              ranked
              visit
              likeCnt
              comment
              childCnt
            }
          }
        }
        `,
          {
            id: data.searchUserByNickname.id,
            projects: data.searchUserByNickname.id,
          },
        );

      const [usernameData2, nicknameData2] = await Promise.all(data2Promises);

      if (data.searchUserByUsername && usernameData2) {
        const user = data.searchUserByUsername;

        users.push({
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          description: user.description,
          profileImage: user.profileImage
            ? `https://playentry.org/uploads/${user.profileImage?.filename?.slice(
                0,
                2,
              )}/${user.profileImage?.filename?.slice(2, 4)}/${
                user.profileImage?.filename
              }.${user.profileImage?.imageType}`
            : undefined,
          coverImage: user.coverImage
            ? `https://playentry.org/uploads/${user.coverImage?.filename?.slice(
                0,
                2,
              )}/${user.coverImage?.filename?.slice(2, 4)}/${
                user.coverImage?.filename
              }.${user.coverImage?.imageType}`
            : undefined,
          role: user.role,
          joined: user.created,
          followers: user.status.follower,
          followings: user.status.following,
          badges:
            usernameData2.getUserBadges.map((prize) => ({
              label: `${prize.contest.name} - ${prize.badgeText}`,
              image: `https://playentry.org/uploads${prize.bannerImageData.path}`,
            })) ?? [],
          privateProjects: user.status.projectAll - user.status.project,
          projects: usernameData2.getUserProjects.list.map((project) => ({
            id: project.id,
            name: project.name,
            thumb: project.thumb
              ? `https://playentry.org${
                  project.thumb.startsWith('/')
                    ? project.thumb
                    : `/${project.thumb}`
                }`
              : undefined,
            category: project.categoryCode,
            created: project.created,
            updated: project.updated,
            staffPicked: project.staffPicked,
            ranked: project.ranked,
            views: project.visit,
            likes: project.likeCnt,
            comments: project.comment,
            remakes: project.childCnt,
          })),
        });
      }
      if (!isSameUser && data.searchUserByNickname && nicknameData2) {
        const user = data.searchUserByNickname;

        users.push({
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          description: user.description,
          profileImage: user.profileImage
            ? `https://playentry.org/uploads/${user.profileImage?.filename?.slice(
                0,
                2,
              )}/${user.profileImage?.filename?.slice(2, 4)}/${
                user.profileImage?.filename
              }.${user.profileImage?.imageType}`
            : undefined,
          coverImage: user.coverImage
            ? `https://playentry.org/uploads/${user.coverImage?.filename?.slice(
                0,
                2,
              )}/${user.coverImage?.filename?.slice(2, 4)}/${
                user.coverImage?.filename
              }.${user.coverImage?.imageType}`
            : undefined,
          role: user.role,
          joined: user.created,
          followers: user.status.follower,
          followings: user.status.following,
          badges:
            nicknameData2?.getUserBadges.map((prize) => ({
              label: `${prize.contest.name} - ${prize.badgeText}`,
              image: `https://playentry.org/uploads${prize.bannerImageData.path}`,
            })) ?? [],
          privateProjects: user.status.projectAll - user.status.project,
          projects: nicknameData2.getUserProjects.list.map((project) => ({
            id: project.id,
            name: project.name,
            thumb: project.thumb
              ? `https://playentry.org${
                  project.thumb.startsWith('/')
                    ? project.thumb
                    : `/${project.thumb}`
                }`
              : undefined,
            category: project.categoryCode,
            created: project.created,
            updated: project.updated,
            staffPicked: project.staffPicked,
            ranked: project.ranked,
            views: project.visit,
            likes: project.likeCnt,
            comments: project.comment,
            remakes: project.childCnt,
          })),
        });
      }

      const projects: {
        total: number;
        searchAfter: [number, number, number];
        list: {
          id: string;
          name: string;
          user: {
            id: string;
            username: string;
            nickname: string;
            profileImage?: string;
          };
          thumb?: string;
          category: string;
          updated: string;
          staffPicked: string;
          ranked: string;
          views: number;
          likes: number;
          comments: number;
        }[];
      } = {
        total: data.searchProjects.total,
        searchAfter: data.searchProjects.searchAfter,
        list: data.searchProjects.list.map((project) => {
          return {
            id: project.id,
            name: project.name,
            user: {
              id: project.user.id,
              username: project.user.username,
              nickname: project.user.nickname,
              profileImage: project.user.profileImage
                ? `https://playentry.org/uploads/${project.user.profileImage?.filename?.slice(
                    0,
                    2,
                  )}/${project.user.profileImage?.filename?.slice(2, 4)}/${
                    project.user.profileImage?.filename
                  }.${project.user.profileImage?.imageType}`
                : undefined,
            },
            thumb: project.thumb
              ? `https://playentry.org${
                  project.thumb.startsWith('/')
                    ? project.thumb
                    : `/${project.thumb}`
                }`
              : undefined,
            category: project.categoryCode,
            updated: project.updated,
            staffPicked: project.staffPicked,
            ranked: project.ranked,
            views: project.visit,
            likes: project.likeCnt,
            comments: project.comment,
          };
        }),
      };

      const discuss: {
        total: number;
        searchAfter: [number, number, number];
        list: {
          id: string;
          title: string;
          content: string;
          user: {
            id: string;
            username: string;
            nickname: string;
            profileImage?: string;
          };
          category: string;
          created: string;
          views: number;
          likes: number;
          comments: number;
          bestComment?: {
            id: string;
            content: string;
            user?: {
              id: string;
              username: string;
              nickname: string;
              profileImage?: string;
            };
            likes: number;
          };
        }[];
      } = {
        total: data.searchDiscuss.total,
        searchAfter: data.searchDiscuss.searchAfter,
        list: data.searchDiscuss.list.map((discuss) => {
          return {
            id: discuss.id,
            title: discuss.title,
            content: discuss.content,
            user: {
              id: discuss.user.id,
              username: discuss.user.username,
              nickname: discuss.user.nickname,
              profileImage: discuss.user.profileImage
                ? `https://playentry.org/uploads/${discuss.user.profileImage?.filename?.slice(
                    0,
                    2,
                  )}/${discuss.user.profileImage?.filename?.slice(2, 4)}/${
                    discuss.user.profileImage?.filename
                  }.${discuss.user.profileImage?.imageType}`
                : undefined,
            },
            category: discuss.category,
            created: discuss.created,
            views: discuss.visit,
            likes: discuss.likesLength,
            comments: discuss.commentsLength,
            bestComment: discuss.bestComment
              ? {
                  id: discuss.bestComment.id,
                  content: discuss.bestComment.content,
                  user: discuss.bestComment.user
                    ? {
                        id: discuss.bestComment.user.id,
                        username: discuss.bestComment.user.username,
                        nickname: discuss.bestComment.user.nickname,
                        profileImage: discuss.bestComment.user.profileImage
                          ? `https://playentry.org/uploads/${discuss.bestComment.user.profileImage?.filename?.slice(
                              0,
                              2,
                            )}/${discuss.bestComment.user.profileImage?.filename?.slice(
                              2,
                              4,
                            )}/${
                              discuss.bestComment.user.profileImage?.filename
                            }.${
                              discuss.bestComment.user.profileImage?.imageType
                            }`
                          : undefined,
                      }
                    : undefined,
                  likes: discuss.bestComment.likesLength,
                }
              : undefined,
          };
        }),
      };

      return {
        users,
        projects,
        discuss,
      };
    }),
  userInfo: procedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input: { username } }) => {
      const data = await graphql<{
        getUserInfo: {
          id: string;
          username: string;
          nickname: string;
          description: string;
          profileImage: { filename: string; imageType: string };
          coverImage: { filename: string; imageType: string };
          role: string;
          created: string;
          status: {
            following: number;
            follower: number;
            project: number;
            projectAll: number;
          };
          badges: { label: string; image: string }[];
        };
      }>(
        `query ($username: String) {
        getUserInfo: user(username: $username) {
          id
          username
          nickname
          description
          profileImage {
            filename
            imageType
          }
          coverImage {
            filename
            imageType
          }
          role
          created
          status {
            following
            follower
            project
            projectAll
          }
        }
      }`,
        { username },
      );

      const data2 = await graphql<{
        getUserBadges: {
          contest: { name: string };
          badgeText: string;
          bannerImageData: { path: string };
        }[];
        getUserProjects: {
          list: {
            id: string;
            name: string;
            thumb: string;
            categoryCode: string;
            created: string;
            updated: string;
            staffPicked: string;
            ranked: string;
            visit: number;
            likeCnt: number;
            comment: number;
            childCnt: number;
          }[];
        };
      }>(
        `query ($id: String!, $projects: Int) {
        getUserBadges: userContestPrizes(id: $id) {
          contest {
            name
          }
          badgeText
          bannerImageData {
            path
          }
        }
        getUserProjects: userProjectList(
          user: $id
          pageParam: { sort: "created", display: $projects }
          searchType: "scroll"
          term: "all"
        ) {
          list {
            id
            name
            thumb
            categoryCode
            created
            updated
            staffPicked
            ranked
            visit
            likeCnt
            comment
            childCnt
          }
        }
      }
      `,
        { id: data.getUserInfo.id, projects: data.getUserInfo.status.project },
      );

      console.log(data2.getUserProjects);

      const user: {
        id: string;
        username: string;
        nickname: string;
        description: string;
        profileImage?: string;
        coverImage?: string;
        role: string;
        joined: string;
        followers: number;
        followings: number;
        badges: { label: string; image: string }[];
        privateProjects: number;
        projects: {
          id: string;
          name: string;
          thumb?: string;
          category: string;
          created: string;
          updated: string;
          staffPicked: string;
          ranked: string;
          views: number;
          likes: number;
          comments: number;
          remakes: number;
        }[];
      } = {
        id: data.getUserInfo.id,
        username: data.getUserInfo.username,
        nickname: data.getUserInfo.nickname,
        description: data.getUserInfo.description,
        profileImage: data.getUserInfo.profileImage
          ? `https://playentry.org/uploads/${data.getUserInfo.profileImage?.filename?.slice(
              0,
              2,
            )}/${data.getUserInfo.profileImage?.filename?.slice(2, 4)}/${
              data.getUserInfo.profileImage?.filename
            }.${data.getUserInfo.profileImage?.imageType}`
          : undefined,
        coverImage: data.getUserInfo.coverImage
          ? `https://playentry.org/uploads/${data.getUserInfo.coverImage?.filename?.slice(
              0,
              2,
            )}/${data.getUserInfo.coverImage?.filename?.slice(2, 4)}/${
              data.getUserInfo.coverImage?.filename
            }.${data.getUserInfo.coverImage?.imageType}`
          : undefined,
        role: data.getUserInfo.role,
        joined: data.getUserInfo.created,
        followers: data.getUserInfo.status.follower,
        followings: data.getUserInfo.status.following,
        badges:
          data2.getUserBadges.map((prize) => ({
            label: `${prize.contest.name} - ${prize.badgeText}`,
            image: `https://playentry.org/uploads${prize.bannerImageData.path}`,
          })) ?? [],
        privateProjects:
          data.getUserInfo.status.projectAll - data.getUserInfo.status.project,
        projects: data2.getUserProjects.list.map((project) => ({
          id: project.id,
          name: project.name,
          thumb: project.thumb
            ? `https://playentry.org${
                project.thumb.startsWith('/')
                  ? project.thumb
                  : `/${project.thumb}`
              }`
            : undefined,
          category: project.categoryCode,
          created: project.created,
          updated: project.updated,
          staffPicked: project.staffPicked,
          ranked: project.ranked,
          views: project.visit,
          likes: project.likeCnt,
          comments: project.comment,
          remakes: project.childCnt,
        })),
      };

      return user;
    }),
  shorten: procedure
    .input(z.object({ url: z.string() }))
    .query(async ({ input: { url } }) => {
      const res = await fetch(
        `https://me2do.naver.com/common/requestJsonpV2.nhn?svcCode=0&url=https://link.naver.com/bridge?url=${encodeURIComponent(
          url,
        )}`,
        { method: 'POST', headers: { Referer: 'link.naver.com' } },
      );
      const data = await res.text();
      const json = JSON.parse(data.trim().slice(1, -1));

      return json.result.httpsUrl;
    }),
});

export type AppRouter = typeof appRouter;
