import { PluginConfigType, SupportedProjectGenerator } from "@/types";

const envFileContent = `NEXT_PUBLIC_BASE_URL=https://jsonplaceholder.typicode.com/`;

const axiosApiReact = (
  isTsProject: boolean,
  projectType?: SupportedProjectGenerator
) =>
  `import axios from "axios";
import Cookies from "js-cookie";

${projectType === "react-vite" ? "const environment = import.meta.env;" : ""}
export const API = axios.create({
  baseURL: ${
    projectType === "react-vite"
      ? "environment.VITE_APP_BASE_URL"
      : projectType === "react-cra"
      ? "process.env.REACT_APP_BASE_URL"
      : projectType === "next"
      ? "process.env.NEXT_PUBLIC_BASE_URL"
      : ""
  },
  withCredentials: true,
});

/**
 * If your backend has refresh and access token then to refresh the access token you can add logic to the below function
 * can save access token in memory and refresh token in cookie
 */
// Define a function to refresh the token
const refreshToken = async () => {
  //   try {
  //     const response = await axios.post("YOUR_REFRESH_TOKEN_ENDPOINT", {
  //       refreshToken: Cookies.get("refreshToken"), // Load the refreshToken from cookies or if https cookie then just make get request to your endpoint
  //     });
  //     const newAccessToken = response.data.accessToken;
  //     Cookies.set("accessToken", newAccessToken, { path: "/" });
  //     return newAccessToken;
  //   } catch (error) {
  //     throw error;
  //   }
};

// A request interceptor to inject the access token into requests
API.interceptors.request.use(
  config => {
    const accessToken = Cookies.get("accessToken"); // Load the access token from cookies or local storage

    if (accessToken) {
      config.headers["Authorization"] = +=+Bearer \${accessToken}+=+;
    }

    return config;
  },
  error => {
    // Handle request errors here

    return Promise.reject(error);
  }
);

// A response interceptor to handle token expiration and auto-refresh
API.interceptors.response.use(
  response => {
    // Modify the response data here
    return response;
  },
  async error => {
    if (error.response && error.response.status === 401) {
      // Token expired, try to refresh the token
      const newAccessToken = await refreshToken();

      // Update the original request with the new access token
      const originalRequest = error.config;
      originalRequest.headers["Authorization"] = +=+Bearer \${newAccessToken}+=+;

      // Retry the original request
      return axios(originalRequest);
    }

    return Promise.reject(error);
  }
);

${
  isTsProject
    ? `//post type
type PostType = {
  userId: number;
  id: number;
  title: string;
  body: string;
};`
    : ""
}

//get posts
export const getPosts = async () =>
  API.get${isTsProject ? "<PostType[]>" : ""}("/posts").then(res => res.data);

//create post
export const createPost = (body${
    isTsProject ? ": { heading: string; content: string }" : ""
  }) =>
  API.post("/item/create", body);

//if you have to change the content type (to send the image or video)
export const imageKitUpload = (body${
    isTsProject
      ? `: {
  useUniqueFileName: boolean;
  file: string;
  publicKey: string;
  fileName: string;
}`
      : ""
  }) =>
  axios.post${
    isTsProject
      ? `<{
    fileId: string;
    name: string;
    url: string;
  }>`
      : ""
  }("APP_IMAGEKIT_UPLOAD_URL_ENDPOINT", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
`
    .replaceAll(/\\/g, "")
    .replaceAll("+=+", "`");

const queryClientOptions = `export const queryClientOptions = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
};
`;

const getQueryClient = `
import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";
import { queryClientOptions } from "./queryClientOptions";

const getQueryClient = cache(() => new QueryClient(queryClientOptions));
export default getQueryClient;

`;

const postClient = (isTsProject: boolean) => `"use client";

import React from "react";
${
  isTsProject
    ? `interface Props {
  post: {
    userId: number;
    id: number;
    title: string;
    body: string;
  };
}`
    : ""
}

export const Post = ({ post }${isTsProject ? `: Props` : ""}) => {
  return (
    <div className="py-4">
      <p className="text-2xl font-semibold">{post.title}</p>
      <p className="mt-2 text-gray-200">{post.body}</p>
    </div>
  );
};
`;

const postsClient = (isTsProject: boolean) => `
"use client";

import { getPosts } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Post } from "./Post.client";

${
  isTsProject
    ? `
type PostType = {
  userId: number;
  id: number;
  title: string;
  body: string;
};`
    : ""
}
export const Posts = () => {
  const { data } = useQuery${isTsProject ? "<PostType[]>" : ""}({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  if (!data) return <div>Not found</div>;

  return (
    <div className="divide-y">
      {data.map(post => (
        <Post post={post} key={post.id} />
      ))}
    </div>
  );
};
`;

const postPage = `import { ReactQueryHydrate } from "@/components/ReactQueryHydrate/ReactQueryHydrate";
import { Posts } from "@/components/posts/Posts.client";
import getQueryClient from "@/lib/getQueryClient";
import { getPosts } from "@/utils/api";
import { dehydrate } from "@tanstack/react-query";

export default async function PostsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(["posts"], getPosts);
  const dehydratedState = dehydrate(queryClient);

  return (
    <ReactQueryHydrate state={dehydratedState}>
      <Posts />
    </ReactQueryHydrate>
  );
}
`;

const providers = (isTsProject: boolean) => `"use client";

import { queryClientOptions } from "@/lib/queryClientOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode, useState } from "react";
${
  isTsProject
    ? `interface Props {
  children: ReactNode;
}`
    : ""
}

export const Providers = ({ children }${isTsProject ? ": Props" : ""}) => {
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
`;

const ReactQueryHydrate = (isTsProject: boolean) => `"use client";

import { Hydrate as RQHydrate, HydrateProps } from "@tanstack/react-query";

export const ReactQueryHydrate = (props${
  isTsProject ? ": HydrateProps" : ""
}) => {
  return <RQHydrate {...props} />;
};
`;

const postLocation = ["src", "components", "posts"];

const ReactQueryNextPlugin: PluginConfigType = {
  initializingMessage: "Adding React Query, Please wait !",
  dependencies: function (isTsProject: boolean) {
    return `@tanstack/react-query @tanstack/react-query-devtools axios js-cookie ${
      isTsProject ? "@types/js-cookie" : ""
    }`;
  },
  files: [
    {
      content: envFileContent,
      fileName: ".env",
      fileType: "native",
      path: [],
    },
    {
      content: axiosApiReact,
      fileName: "api",
      fileType: "native",
      path: ["src", "utils"],
    },
    {
      content: queryClientOptions,
      fileName: "queryClientOptions",
      fileType: "native",
      path: ["src", "lib"],
    },
    {
      content: getQueryClient,
      fileName: "getQueryClient",
      fileType: "native",
      path: ["src", "lib"],
    },
    {
      content: postClient,
      fileName: "Post.client",
      fileType: "component",
      path: postLocation,
    },
    {
      content: postsClient,
      fileName: "Posts.client",
      fileType: "component",
      path: postLocation,
    },
    {
      content: providers,
      fileName: "Providers.client",
      fileType: "component",
      path: ["src", "components", "Providers"],
    },
    {
      content: ReactQueryHydrate,
      fileName: "ReactQueryHydrate",
      fileType: "component",
      path: ["src", "components", "ReactQueryHydrate"],
    },
    {
      content: postPage,
      fileName: "page",
      fileType: "component",
      path: ["src", "app", "posts"],
    },
  ],
  fileModification: {
    Layout: {
      importStatements: `import { Providers } from "@/components/Providers/Providers.client";`,
      addAfterMatch: "</Providers>",
      addBeforeMatch: "<Providers>",
    },
    Page: {},
  },
};

export default ReactQueryNextPlugin;
