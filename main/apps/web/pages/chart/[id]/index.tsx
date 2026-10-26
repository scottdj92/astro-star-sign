import * as React from "react";
import { NextPage, GetServerSideProps } from "next";
import Link from "next/link";

type ChartPageProps = {
  id: string;
};

const Chart: React.FC<ChartPageProps> = ({ id }) => {
  return (
    <div>
      Chart {id}
      <Link href="/">Go back</Link>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<
  ChartPageProps,
  { id: string }
> = async ({ params }) => {
  // TODO: make API request here
  return {
    props: {
      id: params!.id,
    },
  };
};

export default Chart;
