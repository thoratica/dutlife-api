import { initTRPC } from '@trpc/server';
import z from 'zod';
import { graphql } from './utils/graphql.ts';

const { procedure, router } = initTRPC.create();

export const appRouter = router({
  search: procedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input: { query } }) => {
      const data = await graphql<{
        searchUserByUsername: {
          id: string;
          username: string;
          nickname: string;
          description: string;
          profileImage: { filename: string; imageType: string };
          coverImage: { filename: string; imageType: string };
          status: { following: number; follower: number };
          badges: { label: string; image: string }[];
        };
        searchUserByNickname: {
          id: string;
          username: string;
          nickname: string;
          description: string;
          profileImage: { filename: string; imageType: string };
          coverImage: { filename: string; imageType: string };
          status: { following: number; follower: number };
          badges: { label: string; image: string }[];
        };
        searchProjects: {
          total: number;
          list: {
            name: string;
            ranked: boolean;
            user: {
              id: string;
              username: string;
              nickname: string;
              profileImage: { filename: string; imageType: string };
            };
            thumb: string;
            updated: string;
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
          status {
            following
            follower
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
          status {
            following
            follower
          }
        }
        searchProjects: projectList(query: $query, pageParam: { sorts: ["_score", "likeCnt"], display: $display }, searchType: "scroll") {
          total
          list {
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
            updated
          }
          searchAfter
        }
      }`,
        { query, display: 16 },
      );

      const users: {
        id: string;
        username: string;
        nickname: string;
        description: string;
        profileImage?: string;
        coverImage?: string;
        followers: number;
        followings: number;
        badges: { label: string; image: string }[];
      }[] = [];

      const isSameUser =
        data.searchUserByUsername &&
        data.searchUserByNickname &&
        data.searchUserByUsername.id === data.searchUserByNickname.id;

      const badgeDataPromises: (
        | Promise<{
            userContestPrizes: {
              contest: { name: string };
              badgeText: string;
              bannerImageData: { path: string };
            }[];
          }>
        | Promise<undefined>
      )[] = [Promise.resolve(undefined), Promise.resolve(undefined)];

      if (data.searchUserByUsername)
        badgeDataPromises[0] = graphql<{
          userContestPrizes: {
            contest: { name: string };
            badgeText: string;
            bannerImageData: { path: string };
          }[];
        }>(
          `query ($id: String!) {
        userContestPrizes(id: $id) {
          contest {
            name
          }
          badgeText
          bannerImageData {
            path
          }
        }
      }
      `,
          { id: data.searchUserByUsername.id },
        );
      if (!isSameUser && data.searchUserByNickname)
        badgeDataPromises[1] = graphql<{
          userContestPrizes: {
            contest: { name: string };
            badgeText: string;
            bannerImageData: { path: string };
          }[];
        }>(
          `query ($id: String!) {
          userContestPrizes(id: $id) {
            contest {
              name
            }
            badgeText
            bannerImageData {
              path
            }
          }
        }
        `,
          { id: data.searchUserByNickname.id },
        );

      const [usernameBadgeData, nicknameBadgeData] = await Promise.all(
        badgeDataPromises,
      );

      if (data.searchUserByUsername) {
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
          followers: user.status.follower,
          followings: user.status.following,
          badges:
            usernameBadgeData?.userContestPrizes.map((prize) => ({
              label: `${prize.contest.name} - ${prize.badgeText}`,
              image: `https://playentry.org/uploads${prize.bannerImageData.path}`,
            })) ?? [],
        });
      }
      if (!isSameUser && data.searchUserByNickname) {
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
          followers: user.status.follower,
          followings: user.status.following,
          badges:
            nicknameBadgeData?.userContestPrizes.map((prize) => ({
              label: `${prize.contest.name} - ${prize.badgeText}`,
              image: `https://playentry.org/uploads${prize.bannerImageData.path}`,
            })) ?? [],
        });
      }

      const projects: {
        total: number;
        searchAfter: [number, number, number];
        list: {
          name: string;
          user: {
            id: string;
            username: string;
            nickname: string;
            profileImage: string;
          };
          thumb: string;
          updated: string;
        }[];
      } = {
        total: data.searchProjects.total,
        searchAfter: data.searchProjects.searchAfter,
        list: data.searchProjects.list.map((item) => {
          return {
            name: item.name,
            user: {
              id: item.user.id,
              username: item.user.username,
              nickname: item.user.nickname,
              profileImage: item.user.profileImage
                ? `https://playentry.org/uploads/${item.user.profileImage?.filename?.slice(
                    0,
                    2,
                  )}/${item.user.profileImage?.filename?.slice(2, 4)}/${
                    item.user.profileImage?.filename
                  }.${item.user.profileImage?.imageType}`
                : 'https://playentry.org/img/DefaultCardUserThmb.svg',
            },
            thumb: `https://playentry.org${item.thumb}`,
            updated: item.updated,
          };
        }),
      };

      return {
        users,
        projects,
      };
    }),
});

export type AppRouter = typeof appRouter;
