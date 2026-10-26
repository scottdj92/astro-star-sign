import { Button } from "ui";
import { FormEventHandler, useState } from "react";
import Link from "next/link";

export default function Main() {
  const [isLoading, setIsLoading] = useState(false);

  const submitAstrologyInformation: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    console.log(formData.get("location"));
  };

  return (
    <div>
      <h1>Astrology Chart</h1>
      <form onSubmit={submitAstrologyInformation}>
        <label htmlFor="location">
          Input your birth location. More accuracy with a known building
          location
          <input name="location" type="text" placeholder="Location" />
        </label>
        <label htmlFor="age">
          <input name="age" type="text" placeholder="Age" />
        </label>
        <button type="submit">Find out your chart!</button>
      </form>
      <Link href="/chart/something">Navigate to your chart</Link>
    </div>
  );
}
