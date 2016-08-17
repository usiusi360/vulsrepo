#!/usr/bin/perl

use strict;
use warnings;
use Data::Dumper;
use JSON;
use CGI;
use FindBin;
use Cwd;

my $scriptDir = $FindBin::Bin;
if (!(chdir $scriptDir . "/../../results/")) {
  print "Status: 404 Not Found\n"; 
  print CGI::header(-type => 'application/json', -charset => 'UTF-8');
  exit(1);
};

my $resultPath = Cwd::getcwd();
my @json = ();
my @folders = glob "*";

foreach my $folder(@folders){

  if ($folder ne "current") {
    chdir $resultPath . "/" . $folder;
    my @files = glob "*.json";

    my @children = ();
    foreach my $file(@files){
      if ($file ne "all.json"){
         my %hash = ('title' => "$file");
         push(@children, \%hash);
      };
    }

    my %tree = ();
    $tree{"title"} = $folder;
    $tree{"isFolder"} = "true";
    $tree{"children"} = \@children;

    push(@json, \%tree);
  };
}

print CGI::header(-type => 'application/json', -charset => 'UTF-8');
print encode_json(\@json);


