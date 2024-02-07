import { Button, Card, Container, Stack, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import { getPosts } from "../../api/posts";
import { isLoggedIn } from "../../helpers/authHelper";
import CreatePost from "../CreatePost";
import GridLayout from "../GridLayout";
import Loading from "../Loading";
import Navbar from "../Navbar";
import SortBySelect from "../SortBySelect";
import PostCard from "../PostCard";
import Sidebar from "../Sidebar";
import HorizontalStack from "../util/HorizontalStack";
import PostBrowser from "../PostBrowser";

const ExploreView = () => {

  const [catego, setCatego] = useState("");

  return (
    <Container>
      <Navbar catego={catego} setCatego={setCatego} />
      <GridLayout
        left={<PostBrowser createPost contentType="posts" catego={catego}/>} 
        right={<Sidebar/>}
      />
    </Container>
  );
};

export default ExploreView;
